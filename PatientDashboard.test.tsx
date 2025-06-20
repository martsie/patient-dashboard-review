import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientDashboard from './PatientDashboard';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe('PatientDashboard', () => {
  const mockPatients = [
    {
      id: '1',
      name: 'John Doe',
      age: 35,
      lastVisit: '2024-01-15',
      conditions: ['Hypertension', 'Diabetes'],
      isActive: true,
      riskScore: 65
    },
    {
      id: '2',
      name: 'Jane Smith',
      age: 28,
      lastVisit: '2024-02-01',
      conditions: ['Asthma'],
      isActive: false,
      riskScore: 25
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  const renderDashboard = (patients = mockPatients) => {
    return render(<PatientDashboard initialPatients={patients} />);
  };

  describe('Rendering', () => {
    it('renders dashboard with initial patients', () => {
      renderDashboard();
      
      expect(screen.getByText('Patient Dashboard')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('renders empty state when no patients', () => {
      render(<PatientDashboard />);
      
      expect(screen.getByText('No patients found matching your search.')).toBeInTheDocument();
    });

    it('displays correct stats', () => {
      renderDashboard();
      
      expect(screen.getByText('Total: 2')).toBeInTheDocument();
      expect(screen.getByText('Active: 1')).toBeInTheDocument();
      expect(screen.getByText('Avg Age: 31.5')).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('filters patients by name', () => {
      renderDashboard();
      
      const searchInput = screen.getByPlaceholderText('Search patients...');
      fireEvent.change(searchInput, { target: { value: 'John' } });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('filters patients by condition', () => {
      renderDashboard();
      
      const searchInput = screen.getByPlaceholderText('Search patients...');
      fireEvent.change(searchInput, { target: { value: 'Diabetes' } });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('shows no results message when no matches', () => {
      renderDashboard();
      
      const searchInput = screen.getByPlaceholderText('Search patients...');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
      
      expect(screen.getByText('No patients found matching your search.')).toBeInTheDocument();
    });
  });

  describe('Sorting functionality', () => {
    it('sorts by name by default', () => {
      renderDashboard();
      
      const patientCards = screen.getAllByText(/John Doe|Jane Smith/);
      expect(patientCards[0]).toHaveTextContent('Jane Smith');
    });

    it('sorts by age when selected', () => {
      renderDashboard();
      
      const sortSelect = screen.getByRole('combobox');
      fireEvent.change(sortSelect, { target: { value: 'age' } });
      
      const patientCards = screen.getAllByText(/John Doe|Jane Smith/);
      expect(patientCards[0]).toHaveTextContent('Jane Smith');
    });

    it('sorts by last visit when selected', () => {
      renderDashboard();
      
      const sortSelect = screen.getByRole('combobox');
      fireEvent.change(sortSelect, { target: { value: 'lastVisit' } });
      
      const patientCards = screen.getAllByText(/John Doe|Jane Smith/);
      expect(patientCards[0]).toHaveTextContent('John Doe');
    });
  });

  describe('Patient status toggle', () => {
    it('calls API and updates patient status', async () => {
      const mockOnPatientUpdate = jest.fn();
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockPatients[0], isActive: false })
      });

      render(
        <PatientDashboard 
          initialPatients={mockPatients} 
          onPatientUpdate={mockOnPatientUpdate}
        />
      );

      const deactivateButton = screen.getByText('Deactivate');
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://api.seermedical.com/patients/1/status',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: false })
          }
        );
      });

      await waitFor(() => {
        expect(mockOnPatientUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ id: '1', isActive: false })
        );
      });
    });

    it('handles API error gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      renderDashboard();

      const deactivateButton = screen.getByText('Deactivate');
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Failed to update patient status:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Add new patient', () => {
    it('adds a new patient to the list', () => {
      renderDashboard();
      
      const addButton = screen.getByText('Add Patient');
      fireEvent.click(addButton);
      
      expect(screen.getByText('Patient 3')).toBeInTheDocument();
      expect(screen.getByText('Total: 3')).toBeInTheDocument();
    });
  });

  describe('Sync patient data', () => {
    it('syncs patient data successfully', async () => {
      const syncedData = {
        ...mockPatients[0],
        lastSync: '2024-03-01T10:00:00Z'
      };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => syncedData
      });

      renderDashboard();

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Last Sync:/)).toBeInTheDocument();
      });
    });

    it('handles sync error gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Sync failed'));

      renderDashboard();

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Failed to sync patient 1:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Risk score functionality', () => {
    it('displays risk level based on risk score', () => {
      renderDashboard();
      
      expect(screen.getByText('Risk Level: medium')).toBeInTheDocument();
      expect(screen.getByText('Risk Score: 65')).toBeInTheDocument();
    });

    it('calculates risk level based on days since visit when no risk score', () => {
      const patientWithoutRiskScore = {
        ...mockPatients[0],
        riskScore: undefined,
        lastVisit: '2023-01-01'
      };
      
      renderDashboard([patientWithoutRiskScore]);
      
      expect(screen.getByText('Risk Level: high')).toBeInTheDocument();
    });

    it('auto-fetches risk scores for patients without them', async () => {
      const patientWithoutRiskScore = {
        ...mockPatients[0],
        riskScore: undefined
      };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ riskScore: 45 })
      });

      renderDashboard([patientWithoutRiskScore]);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://api.seermedical.com/patients/1/risk-score'
        );
      });
    });
  });

  describe('Export functionality', () => {
    it('logs export data to console', () => {
      renderDashboard();
      
      const exportButton = screen.getByText('Export Data');
      fireEvent.click(exportButton);
      
      expect(console.log).toHaveBeenCalledWith(
        'Exporting patient data:',
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            name: 'John Doe',
            lastVisit: expect.any(String)
          })
        ])
      );
    });
  });

  describe('Loading states', () => {
    it('shows loading indicator during patient status update', async () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderDashboard();

      const deactivateButton = screen.getByText('Deactivate');
      fireEvent.click(deactivateButton);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('disables buttons during loading', async () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderDashboard();

      const deactivateButton = screen.getByText('Deactivate');
      fireEvent.click(deactivateButton);

      expect(deactivateButton).toBeDisabled();
    });
  });

  describe('Edge cases', () => {
    it('handles empty conditions array', () => {
      const patientWithNoConditions = {
        ...mockPatients[0],
        conditions: []
      };
      
      renderDashboard([patientWithNoConditions]);
      
      expect(screen.getByText('Conditions:')).toBeInTheDocument();
    });

    it('handles very old last visit dates', () => {
      const patientWithOldVisit = {
        ...mockPatients[0],
        riskScore: undefined,
        lastVisit: '2020-01-01'
      };
      
      renderDashboard([patientWithOldVisit]);
      
      expect(screen.getByText('Risk Level: high')).toBeInTheDocument();
    });

    it('prevents multiple simultaneous API calls', async () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderDashboard();

      const deactivateButton = screen.getByText('Deactivate');
      
      fireEvent.click(deactivateButton);
      fireEvent.click(deactivateButton);
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });
  });
}); 