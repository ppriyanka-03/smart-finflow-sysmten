import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import Navbar from './Navbar';
import { motion } from 'framer-motion';
import { useState } from 'react';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMobileMenuClick={toggleSidebar} />
        <main className="flex-1 p-6 overflow-auto">
          <div className={`mobile-sidebar-backdrop ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar} />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
