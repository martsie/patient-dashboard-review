import React, { useState, useEffect } from 'react';

interface Patient {
  id: number;
  name: string;
  email: string;
  age: number;
}

const PatientManager: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.hospital.com/patients');
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.log('Error fetching patients:', error);
    }
    setLoading(false);
  };

  const addPatient = async () => {
    if (!name || !email || !age) {
      alert('Please fill all fields');
      return;
    }

    const newPatient = {
      name: name,
      email: email,
      age: parseInt(age)
    };

    try {
      const response = await fetch('https://api.hospital.com/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPatient),
      });
      const patient = await response.json();
      setPatients([...patients, patient]);
      setName('');
      setEmail('');
      setAge('');
    } catch (error) {
      console.log('Error adding patient:', error);
    }
  };

  const updatePatient = async () => {
    if (!name || !email || !age) {
      alert('Please fill all fields');
      return;
    }

    const updatedPatient = {
      id: editingId,
      name: name,
      email: email,
      age: parseInt(age)
    };

    try {
      const response = await fetch(`https://api.hospital.com/patients/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPatient),
      });
      const patient = await response.json();
      setPatients(patients.map(p => p.id === editingId ? patient : p));
      setName('');
      setEmail('');
      setAge('');
      setEditingId(null);
    } catch (error) {
      console.log('Error updating patient:', error);
    }
  };

  const deletePatient = async (id: number) => {
    try {
      await fetch(`https://api.hospital.com/patients/${id}`, {
        method: 'DELETE',
      });
      setPatients(patients.filter(p => p.id !== id));
    } catch (error) {
      console.log('Error deleting patient:', error);
    }
  };

  const editPatient = (patient: Patient) => {
    setName(patient.name);
    setEmail(patient.email);
    setAge(patient.age.toString());
    setEditingId(patient.id);
  };

  const cancelEdit = () => {
    setName('');
    setEmail('');
    setAge('');
    setEditingId(null);
  };

  return (
    <div>
      <h1>Patient Manager</h1>
      
      <div>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        
        {editingId ? (
          <div>
            <button onClick={updatePatient}>Update Patient</button>
            <button onClick={cancelEdit}>Cancel</button>
          </div>
        ) : (
          <button onClick={addPatient}>Add Patient</button>
        )}
      </div>

      {loading && <p>Loading...</p>}

      <div>
        {patients.map(patient => (
          <div key={patient.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <h3>{patient.name}</h3>
            <p>Email: {patient.email}</p>
            <p>Age: {patient.age}</p>
            <button onClick={() => editPatient(patient)}>Edit</button>
            <button onClick={() => deletePatient(patient.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientManager;