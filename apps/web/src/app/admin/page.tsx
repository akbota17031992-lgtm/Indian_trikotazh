import React from 'react';
import type { Metadata } from 'next';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Control Hub | Сеть магазинов «Индийский Трикотаж» Алматы',
  description: 'Панель управления заказами, 16 филиалами, складскими остатками и ролями доступа.',
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
