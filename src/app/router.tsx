import * as React from 'react';
import { HashRouter, Navigate, Route, RouteObject, Routes, useRoutes } from 'react-router-dom';

import Loading from '~/components/Loading';
import Loading2 from '~/components/Loading2';
import { Head } from '~/components/shared/Head';
import SideBar from '~/components/SideBar';

import styles from '../App.module.scss';

import APIDiscovery from './APIDiscovery';

const { Suspense, lazy } = React;

const HomePage = lazy(() => import('../pages/HomePage'));
const ConnectionsPage = lazy(() => import('../pages/ConnectionsPage'));
const ConfigPage = lazy(() => import('../pages/ConfigPage'));
const LogsPage = lazy(() => import('../pages/LogsPage'));
const ProxiesPage = lazy(() => import('../pages/ProxiesPage'));
const RulesPage = lazy(() => import('../pages/RulesPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const BackendPage = lazy(() => import('../pages/BackendPage'));
const StyleGuidePage = lazy(() => import('../pages/StyleGuidePage'));

const routes = [
  { path: '/', element: <Navigate to="/proxies" replace /> },
  { path: '/home', element: <HomePage /> },
  { path: '/connections', element: <ConnectionsPage /> },
  { path: '/configs', element: <ConfigPage /> },
  { path: '/logs', element: <LogsPage /> },
  { path: '/proxies', element: <ProxiesPage /> },
  { path: '/rules', element: <RulesPage /> },
  { path: '/about', element: <AboutPage /> },
  process.env.NODE_ENV === 'development' ? { path: '/style', element: <StyleGuidePage /> } : false,
].filter(Boolean) as RouteObject[];

function DashboardRouter() {
  return (
    <>
      <APIDiscovery />
      <SideBar />
      <div className={styles.content}>
        <Suspense fallback={<Loading2 />}>{useRoutes(routes)}</Suspense>
      </div>
    </>
  );
}

export function AppRouter() {
  return (
    <div className={styles.app}>
      <Head />
      <Suspense fallback={<Loading />}>
        <HashRouter>
          <Routes>
            <Route path="/backend" element={<BackendPage />} />
            <Route path="*" element={<DashboardRouter />} />
          </Routes>
        </HashRouter>
      </Suspense>
    </div>
  );
}
