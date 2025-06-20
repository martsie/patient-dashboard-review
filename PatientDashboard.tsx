import React, { useState, useEffect, useCallback } from 'react';

interface Patient {
  id: string;
  name: string;
  age: number;
  lastVisit: string;
  conditions: string[];
  isActive: boolean;
  riskScore?: number;
  lastSync?: string;
}

interface PatientStats {
  totalPatients: number;
  activePatients: number;
  averageAge: number;
}

interface Props {
  initialPatients?: Patient[];
  onPatientUpdate?: (patient: Patient) => void;
}

// API functions
const patientApi = {
  updatePatientStatus: async (patientId: string, isActive: boolean): Promise<Patient> => {
    const response = await fetch(`https://api.seermedical.com/patients/${patientId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    });
    if (!response.ok) throw new Error('Failed to update patient status');
    return response.json();
  },
  
  fetchRiskScore: async (patientId: string): Promise<number> => {
    const response = await fetch(`https://api.seermedical.com/patients/${patientId}/risk-score`);
    if (!response.ok) throw new Error('Risk service unavailable');
    const data = await response.json();
    return data.riskScore;
  },
  
  syncPatientData: async (patientId: string): Promise<Patient> => {
    const response = await fetch(`https://api.seermedical.com/patients/${patientId}/sync`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Sync failed');
    return response.json();
  }
};

const PatientDashboard: React.FC<Props> = ({ 
  initialPatients = [], 
  onPatientUpdate 
}) => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'lastVisit'>('name');
  const [stats, setStats] = useState<PatientStats>({
    totalPatients: 0,
    activePatients: 0,
    averageAge: 0
  });
  const [loading, setLoading] = useState(false);
  const [loadingRisk, setLoadingRisk] = useState<Set<string>>(new Set());
  const [syncingPatients, setSyncingPatients] = useState<Set<string>>(new Set());

  // Calculate stats whenever patients change
  useEffect(() => {
    const totalPatients = patients.length;
    const activePatients = patients.filter(p => p.isActive).length;
    const averageAge = patients.length > 0 
      ? patients.reduce((sum, p) => sum + p.age, 0) / patients.length 
      : 0;
    
    setStats({
      totalPatients,
      activePatients,
      averageAge: Math.round(averageAge * 100) / 100
    });
  }, [patients]);

  // Auto-fetch risk scores for patients without them
  useEffect(() => {
    const patientsWithoutRisk = patients.filter(p => p.riskScore === undefined);
    
    patientsWithoutRisk.forEach(async (patient) => {
      if (loadingRisk.has(patient.id)) return;
      
      setLoadingRisk(prev => new Set([...prev, patient.id]));
      
      try {
        const riskScore = await patientApi.fetchRiskScore(patient.id);
        setPatients(currentPatients => 
          currentPatients.map(p => 
            p.id === patient.id ? { ...p, riskScore } : p
          )
        );
      } catch (error) {
        console.error(`Failed to fetch risk score for ${patient.id}:`, error);
      }
      
      setLoadingRisk(prev => {
        const newSet = new Set(prev);
        newSet.delete(patient.id);
        return newSet;
      });
    });
  }, [patients, loadingRisk]);

  // Filter and sort patients
  useEffect(() => {
    let filtered = patients.filter(patient => 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.conditions.some(condition => 
        condition.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Sort patients
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'age') {
        return a.age - b.age;
      } else {
        return new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime();
      }
    });

    setFilteredPatients(filtered);
  }, [patients, searchTerm, sortBy]);

  const handlePatientToggle = useCallback(async (patientId: string) => {
    if (loading) return; // Prevent multiple simultaneous requests
    
    setLoading(true);
    
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;
      
      const result = await patientApi.updatePatientStatus(patientId, !patient.isActive);
      
      const updatedPatients = patients.map(p => {
        if (p.id === patientId) {
          const updatedPatient = { ...p, isActive: result.isActive };
          onPatientUpdate?.(updatedPatient);
          return updatedPatient;
        }
        return p;
      });
      
      setPatients(updatedPatients);
    } catch (error) {
      console.error('Failed to update patient status:', error);
      alert('Failed to update patient status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [patients, onPatientUpdate, loading]);

  const addNewPatient = useCallback(() => {
    const newPatient: Patient = {
      id: Date.now().toString(),
      name: `Patient ${patients.length + 1}`,
      age: 45,
      lastVisit: new Date().toISOString().split('T')[0],
      conditions: ['General Checkup'],
      isActive: true
    };
    
    setPatients([...patients, newPatient]);
  }, [patients]);

  const syncPatientData = useCallback(async (patientId: string) => {
    if (syncingPatients.has(patientId)) return;
    
    setSyncingPatients(prev => new Set([...prev, patientId]));
    
    try {
      const syncedData = await patientApi.syncPatientData(patientId);
      
      setPatients(currentPatients => 
        currentPatients.map(p => 
          p.id === patientId 
            ? { ...p, ...syncedData, lastSync: syncedData.lastSync }
            : p
        )
      );
    } catch (error) {
      console.error(`Failed to sync patient ${patientId}:`, error);
    }
    
    setSyncingPatients(prev => {
      const newSet = new Set(prev);
      newSet.delete(patientId);
      return newSet;
    });
  }, [syncingPatients]);

  const exportPatientData = useCallback(() => {
    const data = filteredPatients.map(patient => ({
      ...patient,
      lastVisit: new Date(patient.lastVisit).toLocaleDateString()
    }));
    
    console.log('Exporting patient data:', data);
    // In real app, this would trigger a download
  }, [filteredPatients]);

  const getPatientRiskLevel = (patient: Patient) => {
    const daysSinceVisit = Math.floor(
      (Date.now() - new Date(patient.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Use risk score if available, otherwise fall back to days calculation
    if (patient.riskScore !== undefined) {
      if (patient.riskScore >= 70) return 'high';
      if (patient.riskScore >= 40) return 'medium';
      return 'low';
    }
    
    if (daysSinceVisit > 365) return 'high';
    if (daysSinceVisit > 180) return 'medium';
    return 'low';
  };

  return (
    <div className="patient-dashboard">
      <div className="dashboard-header">
        <h2>Patient Dashboard</h2>
        <div className="stats">
          <div>Total: {stats.totalPatients}</div>
          <div>Active: {stats.activePatients}</div>
          <div>Avg Age: {stats.averageAge}</div>
        </div>
      </div>

      <div className="controls">
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as 'name' | 'age' | 'lastVisit')}
        >
          <option value="name">Sort by Name</option>
          <option value="age">Sort by Age</option>
          <option value="lastVisit">Sort by Last Visit</option>
        </select>

        <button onClick={addNewPatient}>Add Patient</button>
        <button onClick={exportPatientData}>Export Data</button>
      </div>

      {loading && <div className="loading">Processing...</div>}

      <div className="patient-list">
        {filteredPatients.map(patient => (
          <div key={patient.id} className="patient-card">
            <div className="patient-info">
              <h3>{patient.name}</h3>
              <p>Age: {patient.age}</p>
              <p>Last Visit: {patient.lastVisit}</p>
              <p>Conditions: {patient.conditions.join(', ')}</p>
              <p>Risk Level: {getPatientRiskLevel(patient)}</p>
              {patient.riskScore !== undefined && (
                <p>Risk Score: {patient.riskScore}</p>
              )}
              {patient.lastSync && (
                <p>Last Sync: {new Date(patient.lastSync).toLocaleString()}</p>
              )}
            </div>
            
            <div className="patient-actions">
              <button
                onClick={() => handlePatientToggle(patient.id)}
                disabled={loading}
                className={patient.isActive ? 'active' : 'inactive'}
              >
                {patient.isActive ? 'Deactivate' : 'Activate'}
              </button>
              
              <button
                onClick={() => syncPatientData(patient.id)}
                disabled={syncingPatients.has(patient.id)}
                className="sync-btn"
              >
                {syncingPatients.has(patient.id) ? 'Syncing...' : 'Sync Data'}
              </button>
              
              {loadingRisk.has(patient.id) && (
                <span className="loading-indicator">Loading risk...</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="no-results">
          No patients found matching your search.
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;