import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PatientManager from './PatientManager';

// Mock fetch
global.fetch = jest.fn();

describe('PatientManager', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('renders patient manager title', () => {
    render(<PatientManager />);
    expect(screen.getByText('Patient Manager')).toBeInTheDocument();
  });

  test('renders input fields', () => {
    render(<PatientManager />);
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Age')).toBeInTheDocument();
  });

  test('adds a new patient', async () => {
    const mockPatient = { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPatient,
    });

    render(<PatientManager />);
    
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Age'), {
      target: { value: '30' },
    });
    
    fireEvent.click(screen.getByText('Add Patient'));
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  test('shows alert when trying to add patient with empty fields', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<PatientManager />);
    
    fireEvent.click(screen.getByText('Add Patient'));
    
    expect(alertSpy).toHaveBeenCalledWith('Please fill all fields');
    
    alertSpy.mockRestore();
  });

  test('deletes a patient', async () => {
    const mockPatients = [
      { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 }
    ];
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPatients,
    });
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    render(<PatientManager />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  test('edits a patient', async () => {
    const mockPatients = [
      { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 }
    ];
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPatients,
    });

    render(<PatientManager />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Edit'));
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Update Patient')).toBeInTheDocument();
  });
}