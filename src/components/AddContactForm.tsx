import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { validateSaudiNumber, formatPhoneNumber } from '../utils/phoneValidation';

interface AddContactFormProps {
  onContactAdded: () => void;
}

export default function AddContactForm({ onContactAdded }: AddContactFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedNumber = formatPhoneNumber(phoneNumber);
    if (!formattedNumber || !validateSaudiNumber(formattedNumber)) {
      toast.error('Please enter a valid Saudi mobile number');
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .insert([{ 
          phone_number: formattedNumber
        }])
        .select();

      if (error) {
        if (error.code === '23505') {
          // Check if the contact exists but is inactive
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id, is_active')
            .eq('phone_number', formattedNumber)
            .single();

          if (existingContact && !existingContact.is_active) {
            // Reactivate the contact
            const { error: updateError } = await supabase
              .from('contacts')
              .update({ is_active: true })
              .eq('id', existingContact.id);

            if (updateError) throw updateError;
            toast.success('Contact reactivated successfully');
          } else {
            toast.error('This phone number already exists in your contacts');
          }
        } else {
          throw error;
        }
      } else {
        toast.success('Contact added successfully');
      }
      
      setPhoneNumber('');
      onContactAdded();
    } catch (error: any) {
      toast.error(error.message || 'Error adding contact');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 h-[250px] flex flex-col">
      <h2 className="text-lg font-medium mb-4">Add New Contact</h2>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="966XXXXXXXXX or 05XXXXXXXX"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Contact
        </button>
      </form>
    </div>
  );
}