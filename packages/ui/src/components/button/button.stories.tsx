import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { MailIcon } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
        'tertiary-green',
        'tertiary-blue',
        'tertiary-soil',
      ],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Default button with primary styling.
 */
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
};

/**
 * Button with destructive styling.
 */
export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};

/**
 * Button with outline styling.
 */
export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

/**
 * Button with secondary styling.
 */
export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

/**
 * Button with ghost styling.
 */
export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

/**
 * Button with link styling.
 */
export const Link: Story = {
  args: {
    children: 'Link',
    variant: 'link',
  },
};

/**
 * Button with TerraFusion's green tertiary styling.
 */
export const TertiaryGreen: Story = {
  args: {
    children: 'Crop Data',
    variant: 'tertiary-green',
  },
};

/**
 * Button with TerraFusion's blue tertiary styling.
 */
export const TertiaryBlue: Story = {
  args: {
    children: 'Water Analysis',
    variant: 'tertiary-blue',
  },
};

/**
 * Button with TerraFusion's soil tertiary styling.
 */
export const TertiarySoil: Story = {
  args: {
    children: 'Soil Data',
    variant: 'tertiary-soil',
  },
};

/**
 * Button with icon.
 */
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <MailIcon className="mr-2 h-4 w-4" /> Email
      </>
    ),
  },
};

/**
 * Button in loading state.
 */
export const Loading: Story = {
  args: {
    children: 'Loading',
    loading: true,
  },
};

/**
 * Disabled button.
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

/**
 * Small button.
 */
export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

/**
 * Large button.
 */
export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
};

/**
 * Icon button.
 */
export const IconButton: Story = {
  args: {
    children: <MailIcon className="h-4 w-4" />,
    size: 'icon',
    'aria-label': 'Send email',
  },
};