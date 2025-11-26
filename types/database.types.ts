/**
 * Database Types for SocialOps v7.0 Schema
 * Type-safe definitions for all database tables
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            teams: {
                Row: {
                    id: string;
                    name: string;
                    owner_id: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    owner_id: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    owner_id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            team_members: {
                Row: {
                    id: string;
                    team_id: string;
                    user_id: string;
                    role: 'owner' | 'admin' | 'member';
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    team_id: string;
                    user_id: string;
                    role?: 'owner' | 'admin' | 'member';
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    team_id?: string;
                    user_id?: string;
                    role?: 'owner' | 'admin' | 'member';
                    created_at?: string;
                };
            };
            clients: {
                Row: {
                    id: string;
                    team_id: string;
                    name: string;
                    email: string | null;
                    phone: string | null;
                    company: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id?: string;
                    team_id: string;
                    name: string;
                    email?: string | null;
                    phone?: string | null;
                    company?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    id?: string;
                    team_id?: string;
                    name?: string;
                    email?: string | null;
                    phone?: string | null;
                    company?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
            };
            routines: {
                Row: {
                    id: string;
                    team_id: string;
                    client_id: string | null;
                    title: string;
                    description: string | null;
                    frequency: Json;
                    start_date: string;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id?: string;
                    team_id: string;
                    client_id?: string | null;
                    title: string;
                    description?: string | null;
                    frequency: Json;
                    start_date: string;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    id?: string;
                    team_id?: string;
                    client_id?: string | null;
                    title?: string;
                    description?: string | null;
                    frequency?: Json;
                    start_date?: string;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
            };
            tasks: {
                Row: {
                    id: string;
                    team_id: string;
                    client_id: string | null;
                    project_id: string | null;
                    routine_id: string | null;
                    title: string;
                    description: string | null;
                    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
                    priority: 'low' | 'medium' | 'high' | 'urgent';
                    due_date: string | null;
                    assigned_to: string | null;
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                    completed_at: string | null;
                };
                Insert: {
                    id?: string;
                    team_id: string;
                    client_id?: string | null;
                    project_id?: string | null;
                    routine_id?: string | null;
                    title: string;
                    description?: string | null;
                    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
                    priority?: 'low' | 'medium' | 'high' | 'urgent';
                    due_date?: string | null;
                    assigned_to?: string | null;
                    created_by: string;
                    created_at?: string;
                    updated_at?: string;
                    completed_at?: string | null;
                };
                Update: {
                    id?: string;
                    team_id?: string;
                    client_id?: string | null;
                    project_id?: string | null;
                    routine_id?: string | null;
                    title?: string;
                    description?: string | null;
                    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
                    priority?: 'low' | 'medium' | 'high' | 'urgent';
                    due_date?: string | null;
                    assigned_to?: string | null;
                    created_by?: string;
                    created_at?: string;
                    updated_at?: string;
                    completed_at?: string | null;
                };
            };
            projects: {
                Row: {
                    id: string;
                    team_id: string;
                    client_id: string | null;
                    name: string;
                    description: string | null;
                    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
                    start_date: string | null;
                    end_date: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    team_id: string;
                    client_id?: string | null;
                    name: string;
                    description?: string | null;
                    status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
                    start_date?: string | null;
                    end_date?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    team_id?: string;
                    client_id?: string | null;
                    name?: string;
                    description?: string | null;
                    status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
                    start_date?: string | null;
                    end_date?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            system_logs: {
                Row: {
                    id: string;
                    team_id: string;
                    user_id: string | null;
                    action: string;
                    entity_type: string | null;
                    entity_id: string | null;
                    metadata: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    team_id: string;
                    user_id?: string | null;
                    action: string;
                    entity_type?: string | null;
                    entity_id?: string | null;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    team_id?: string;
                    user_id?: string | null;
                    action?: string;
                    entity_type?: string | null;
                    entity_id?: string | null;
                    metadata?: Json | null;
                    created_at?: string;
                };
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    team_id: string;
                    type: string;
                    title: string;
                    message: string;
                    read: boolean;
                    metadata: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    team_id: string;
                    type: string;
                    title: string;
                    message: string;
                    read?: boolean;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    team_id?: string;
                    type?: string;
                    title?: string;
                    message?: string;
                    read?: boolean;
                    metadata?: Json | null;
                    created_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}
