/**
 * Template API Adapter
 * 
 * Converts between Template API models and UI models
 */

import { CrmTemplate, CrmTemplateRequest } from '@/types/crmApi';

// UI Template type (if not in types/index.ts, we can add it)
export interface Template {
  id: string;
  name: string;
  content: string[]; // Array of strings (messages)
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Convert CRM Template to UI Template model
 */
export function crmTemplateToTemplate(crmTemplate: CrmTemplate): Template {
  return {
    id: crmTemplate.id,
    name: crmTemplate.name,
    content: crmTemplate.content || [],
    createdAt: crmTemplate.created_at ? new Date(crmTemplate.created_at) : undefined,
    updatedAt: crmTemplate.updated_at ? new Date(crmTemplate.updated_at) : undefined,
  };
}

/**
 * Convert UI Template model to CRM Template Request
 */
export function templateToCrmTemplate(template: Partial<Template> & { name: string; content: string[] }): CrmTemplateRequest {
  return {
    name: template.name,
    content: template.content || [],
    org_id: undefined, // Can be set if needed
  };
}

/**
 * Convert array of CRM Templates to array of Templates
 */
export function crmTemplatesToTemplates(templates: CrmTemplate[] | null | undefined): Template[] {
  if (!templates || !Array.isArray(templates)) {
    return [];
  }
  
  return templates
    .map(crmTemplateToTemplate)
    .filter((template): template is Template => template !== undefined);
}

