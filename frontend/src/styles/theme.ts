import { SourceType, ToolType } from '../types';

export const KUBEFLOW_LOGO = 'https://seeklogo.com/images/K/kubeflow-logo-0CC766E8B7-seeklogo.com.png';

export const sourceConfig: Record<SourceType, { color: string; lightColor: string; label: string; icon: string }> = {
  docs:     { color: '#1976D2', lightColor: '#E3F2FD', label: 'Docs',   icon: '' },
  issues:   { color: '#FB8C00', lightColor: '#FFF3E0', label: 'Issues', icon: '' },
  platform: { color: '#2E7D32', lightColor: '#E8F5E9', label: 'KEPs',   icon: '' },
};

export const toolMessages: Record<string, string> = {
  search_docs:     'Searching documentation...',
  search_issues:   'Checking known issues...',
  search_platform: 'Looking up architecture...',
};

export const toolIcons: Record<string, string> = {
  search_docs:     '',
  search_issues:   '',
  search_platform: '',
};