import React from 'react';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';

interface GuestLayoutProps {
  children: React.ReactNode;
}

const GuestLayout: React.FC<GuestLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header for guest users */}
      <GuestNavbar />

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer for guest users */}
      <GuestFooter />
    </div>
  );
};

export default GuestLayout;
