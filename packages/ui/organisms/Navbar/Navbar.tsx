import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../../atoms/Button';
import { Text } from '../../atoms/Text';
import { type BaseProps } from '../../types';

export interface NavItem {
  /**
   * Label for the navigation item
   */
  label: string;
  
  /**
   * URL for the navigation item
   */
  href: string;
  
  /**
   * Optional icon for the navigation item
   */
  icon?: React.ReactNode;
  
  /**
   * Whether this is the active route
   */
  isActive?: boolean;
}

export interface NavbarProps extends BaseProps {
  /**
   * The application logo
   */
  logo: React.ReactNode;
  
  /**
   * The application name
   */
  appName: string;
  
  /**
   * The navigation items
   */
  navItems: NavItem[];
  
  /**
   * User information (for the user dropdown)
   */
  user?: {
    name: string;
    avatar?: string;
  };
  
  /**
   * Actions for the user dropdown
   */
  userActions?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }[];
  
  /**
   * Actions for the right side of the navbar
   */
  actions?: React.ReactNode;
  
  /**
   * Additional classes for the navbar
   */
  className?: string;
  
  /**
   * On nav item click handler
   */
  onNavItemClick?: (item: NavItem) => void;
}

/**
 * Navbar organism component
 * 
 * A complete navigation bar for the application.
 */
export const Navbar: React.FC<NavbarProps> = ({
  logo,
  appName,
  navItems,
  user,
  userActions,
  actions,
  className,
  testId,
  onNavItemClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  return (
    <nav 
      className={cn(
        'bg-white px-4 py-2 border-b border-neutral-200 shadow-sm',
        className
      )}
      data-testid={testId}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between h-16">
        {/* Logo and App Name */}
        <div className="flex items-center">
          <div className="flex-shrink-0 flex items-center">
            {logo}
            <Text 
              as="span"
              variant="h5" 
              color="primary" 
              className="ml-2 font-bold hidden md:block"
            >
              {appName}
            </Text>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:ml-6 md:flex md:space-x-4">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={item.isActive ? 'default' : 'ghost'}
                leftIcon={item.icon}
                className={cn(
                  item.isActive
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-neutral-600 hover:text-primary-700 hover:bg-primary-50'
                )}
                onClick={() => onNavItemClick?.(item)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Actions and User */}
        <div className="flex items-center">
          {/* Custom Actions */}
          <div className="hidden md:flex items-center space-x-2 mr-4">
            {actions}
          </div>
          
          {/* User Menu */}
          {user && (
            <div className="relative ml-3">
              <div>
                <button
                  type="button"
                  className="flex items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  {user.avatar ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.avatar}
                      alt={user.name}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
              </div>
              
              {isUserMenuOpen && userActions && (
                <div 
                  className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <Text variant="bodySmall" className="font-medium">{user.name}</Text>
                  </div>
                  {userActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        action.onClick();
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Mobile menu button */}
          <div className="flex md:hidden ml-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">
                {isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              </span>
              {/* Hamburger icon */}
              <svg
                className={cn('h-6 w-6', isMobileMenuOpen ? 'hidden' : 'block')}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* X icon */}
              <svg
                className={cn('h-6 w-6', isMobileMenuOpen ? 'block' : 'hidden')}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                leftIcon={item.icon}
                fullWidth
                className={cn(
                  'justify-start',
                  item.isActive
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-neutral-600 hover:bg-neutral-50'
                )}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavItemClick?.(item);
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
          
          {/* Mobile Actions */}
          {actions && (
            <div className="border-t border-neutral-200 pb-3 pt-4">
              <div className="space-y-1 px-2">{actions}</div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};