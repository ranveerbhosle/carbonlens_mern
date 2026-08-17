import React from 'react';
import Navbar from './Navbar';
import Toast from './Toast';

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Toast />
    </>
  );
}

