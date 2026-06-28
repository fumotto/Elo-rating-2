import { type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

export function AdminOnly({ children }: { children: ReactNode }) {
    const { profile } = useAuth();
    if (!profile || profile.role !== 'admin_user') {
        return null;
    }
    return <>{children}</>;
}
