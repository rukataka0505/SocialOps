export const SYSTEM_FIELDS = [
    { id: 'title', label: 'タイトル', type: 'text', required: true, system: true },
    { id: 'due_date', label: '期限', type: 'date', required: true, system: true },
    { id: 'workflow_status', label: 'ステータス', type: 'select', required: true, system: true },
    { id: 'assigned_to', label: '担当者', type: 'user', required: false, system: true },
    { id: 'client_id', label: '案件', type: 'select', required: false, system: true },
] as const;
