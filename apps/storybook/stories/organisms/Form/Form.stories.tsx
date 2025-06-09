import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Form } from '../../../../../packages/ui/organisms/Form';
import { Input } from '../../../../../packages/ui/atoms/Input';
import { Button } from '../../../../../packages/ui/atoms/Button';

const meta: Meta<typeof Form> = {
  title: 'TerraFusion/Organisms/Form',
  component: Form,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  render: (args) => {
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
    });
    
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };
    
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log('Form submitted:', formData);
      // In a real application, you'd do something with this data
    };
    
    return (
      <Form
        {...args}
        onSubmit={handleSubmit}
        submitText="Submit Form"
      >
        <Form.Field
          label="First Name"
          description="Enter your first name"
          error={formData.firstName.length < 2 && formData.firstName.length > 0 ? 'First name must be at least 2 characters' : ''}
        >
          <Input
            placeholder="John"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
        </Form.Field>
        
        <Form.Field
          label="Last Name"
          description="Enter your last name"
          error={formData.lastName.length < 2 && formData.lastName.length > 0 ? 'Last name must be at least 2 characters' : ''}
        >
          <Input
            placeholder="Doe"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
        </Form.Field>
        
        <Form.Field
          label="Email"
          description="Enter your email address"
          error={formData.email && !formData.email.includes('@') ? 'Please enter a valid email address' : ''}
        >
          <Input
            type="email"
            placeholder="john.doe@example.com"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </Form.Field>
      </Form>
    );
  },
};

export const WithSuccess: Story = {
  render: () => {
    return (
      <Form
        onSubmit={(e) => e.preventDefault()}
        submitText="Submit Form"
        success="Form submitted successfully!"
      >
        <Form.Field label="Name">
          <Input value="John Doe" readOnly />
        </Form.Field>
        
        <Form.Field label="Email">
          <Input value="john.doe@example.com" readOnly />
        </Form.Field>
      </Form>
    );
  },
};

export const WithError: Story = {
  render: () => {
    return (
      <Form
        onSubmit={(e) => e.preventDefault()}
        submitText="Submit Form"
        error="There was an error submitting the form. Please try again."
      >
        <Form.Field label="Name">
          <Input placeholder="John Doe" />
        </Form.Field>
        
        <Form.Field label="Email">
          <Input placeholder="john.doe@example.com" />
        </Form.Field>
      </Form>
    );
  },
};

export const Loading: Story = {
  render: () => {
    return (
      <Form
        onSubmit={(e) => e.preventDefault()}
        submitText="Submitting..."
        isSubmitting={true}
      >
        <Form.Field label="Name">
          <Input placeholder="John Doe" disabled />
        </Form.Field>
        
        <Form.Field label="Email">
          <Input placeholder="john.doe@example.com" disabled />
        </Form.Field>
      </Form>
    );
  },
};

export const WithCancel: Story = {
  render: () => {
    return (
      <Form
        onSubmit={(e) => e.preventDefault()}
        submitText="Submit"
        cancelText="Cancel"
        onCancel={() => console.log('Cancelled')}
      >
        <Form.Field label="Name">
          <Input placeholder="John Doe" />
        </Form.Field>
        
        <Form.Field label="Email">
          <Input placeholder="john.doe@example.com" />
        </Form.Field>
      </Form>
    );
  },
};

export const FieldValidation: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      confirmPassword: '',
    });
    
    const [errors, setErrors] = useState({
      username: '',
      password: '',
      confirmPassword: '',
    });
    
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      
      // Validate on change
      validate(name, value);
    };
    
    const validate = (field, value) => {
      let newErrors = { ...errors };
      
      switch (field) {
        case 'username':
          if (value.length < 3 && value.length > 0) {
            newErrors.username = 'Username must be at least 3 characters';
          } else {
            newErrors.username = '';
          }
          break;
        
        case 'password':
          if (value.length < 8 && value.length > 0) {
            newErrors.password = 'Password must be at least 8 characters';
          } else {
            newErrors.password = '';
          }
          
          // Check confirmation if it was already entered
          if (formData.confirmPassword && value !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
          } else if (formData.confirmPassword) {
            newErrors.confirmPassword = '';
          }
          break;
        
        case 'confirmPassword':
          if (value !== formData.password) {
            newErrors.confirmPassword = 'Passwords do not match';
          } else {
            newErrors.confirmPassword = '';
          }
          break;
          
        default:
          break;
      }
      
      setErrors(newErrors);
    };
    
    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Validate all fields
      Object.keys(formData).forEach(field => {
        validate(field, formData[field]);
      });
      
      const hasErrors = Object.values(errors).some(error => error !== '');
      const hasEmptyFields = Object.values(formData).some(value => value === '');
      
      if (!hasErrors && !hasEmptyFields) {
        console.log('Form submitted successfully:', formData);
      } else {
        console.log('Form has errors or empty fields');
      }
    };
    
    return (
      <Form
        onSubmit={handleSubmit}
        submitText="Create Account"
      >
        <Form.Field
          label="Username"
          description="Choose a unique username"
          error={errors.username}
        >
          <Input
            placeholder="johndoe"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </Form.Field>
        
        <Form.Field
          label="Password"
          description="At least 8 characters long"
          error={errors.password}
        >
          <Input
            type="password"
            placeholder="••••••••"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </Form.Field>
        
        <Form.Field
          label="Confirm Password"
          error={errors.confirmPassword}
        >
          <Input
            type="password"
            placeholder="••••••••"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </Form.Field>
      </Form>
    );
  },
};

export const ComplexForm: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      role: 'user',
      notifications: true,
      bio: '',
    });
    
    const handleChange = (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setFormData({
        ...formData,
        [e.target.name]: value,
      });
    };
    
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          console.log('Complex form submitted:', formData);
        }}
        submitText="Save Profile"
        cancelText="Discard Changes"
        onCancel={() => console.log('Cancelled')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form.Field label="Name">
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
            />
          </Form.Field>
          
          <Form.Field label="Email">
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
            />
          </Form.Field>
          
          <Form.Field label="Role">
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </Form.Field>
          
          <Form.Field label="Receive Notifications">
            <div className="flex items-center h-10">
              <input
                type="checkbox"
                name="notifications"
                checked={formData.notifications}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <span className="ml-2 text-neutral-700 text-sm">
                Send me email notifications
              </span>
            </div>
          </Form.Field>
        </div>
        
        <Form.Field label="Bio" description="Tell us a bit about yourself">
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            placeholder="I am a developer..."
          />
        </Form.Field>
      </Form>
    );
  },
};