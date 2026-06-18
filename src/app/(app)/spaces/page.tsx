// src/app/(app)/spaces/page.tsx
'use client';

import {
  MoreHorizontal,
  PlusCircle,
  Share2,
  Edit,
  Trash2,
  Package,
  BarChart2,
  LayoutGrid,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { SpacesIllustration } from '@/components/illustrations';
import { ProductTour } from '@/components/product-tour';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { format } from 'date-fns';
import { useSpaces, type Space } from '@/lib/spaces-provider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { UpgradeDialog } from '@/components/upgrade-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useMemo } from 'react';
import { ShareSpaceDialog } from '@/components/share-space-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Folder } from '@/lib/folder-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabaseClient';

const spaceTemplates = [
    {
      title: 'Sell side M&A data room',
      description: 'Streamline secure content sharing for mergers and acquisitions.',
      folders: [
        { name: 'Legal and Corporate Documents', children: [
            { name: 'Articles of Incorporation', children: [] },
            { name: 'Bylaws', children: [] },
            { name: 'Shareholder Agreements', children: [] },
            { name: 'Board Resolutions', children: [] },
            { name: 'Minutes of Meetings', children: [] },
            { name: 'Organizational Chart', children: [] },
            { name: 'Corporate Policies and Procedures', children: [] },
        ]},
        { name: 'Financial Statements', children: [
            { name: 'Balance Sheets', children: [] },
            { name: 'Income Statements', children: [] },
            { name: 'Cash Flow Statements', children: [] },
            { name: 'Statement of Shareholders\' Equity', children: [] },
            { name: 'Notes to Financial Statements', children: [] },
        ]},
        { name: 'Due Diligence Reports', children: [
            { name: 'Legal Due Diligence Report', children: [] },
            { name: 'Financial Due Diligence Report', children: [] },
            { name: 'Tax Due Diligence Report', children: [] },
            { name: 'Environmental Due Diligence Report', children: [] },
            { name: 'Operational Due Diligence Report', children: [] },
        ]},
        { name: 'Contracts and Agreements', children: [
            { name: 'Client Contracts', children: [] },
            { name: 'Supplier Contracts', children: [] },
            { name: 'Employment Agreements', children: [] },
            { name: 'Non-Disclosure Agreements', children: [] },
            { name: 'Licensing Agreements', children: [] },
            { name: 'Distribution Agreements', children: [] },
            { name: 'Joint Venture Agreements', children: [] },
        ]},
        { name: 'Regulatory Compliance', children: [
          { name: 'Regulatory Filings', children: [] },
          { name: 'Compliance Policies', children: [] },
          { name: 'Regulatory Approvals', children: [] },
          { name: 'Licenses and Permits', children: [] },
          { name: 'Compliance Audit Reports', children: [] },
        ] },
        {
          name: 'Intellectual Property',
          children: [
            { name: 'Patents', children: [] },
            { name: 'Trademarks', children: [] },
            { name: 'Copyrights', children: [] },
            { name: 'Trade Secrets', children: [] },
            { name: 'Licensing Agreements', children: [] },
            { name: 'IP Valuation Reports', children: [] },
          ],
        },
        {
          name: 'Human Resources',
          children: [
            { name: 'Employee Handbook', children: [] },
            { name: 'Organizational Structure', children: [] },
            { name: 'Employee Benefits Information', children: [] },
            { name: 'Payroll Records', children: [] },
            { name: 'Performance Reviews', children: [] },
            { name: 'Employment Policies and Procedures', children: [] },
          ],
        },
        {
          name: 'Real Estate',
          children: [
            { name: 'Property Leases', children: [] },
            { name: 'Real Estate Holdings', children: [] },
            { name: 'Property Valuation Reports', children: [] },
            { name: 'Environmental Assessments', children: [] },
            { name: 'Title Deeds', children: [] },
          ],
        },
        {
          name: 'IT Infrastructure',
          children: [
            { name: 'Network Diagrams', children: [] },
            { name: 'Software Licenses', children: [] },
            { name: 'Data Security Policies', children: [] },
            { name: 'IT Audit Reports', children: [] },
            { name: 'System Documentation', children: [] },
          ],
        },
        {
          name: 'Risk Management',
          children: [
            { name: 'Risk Assessment Reports', children: [] },
            { name: 'Insurance Policies', children: [] },
            { name: 'Business Continuity Plans', children: [] },
            { name: 'Contingency Plans', children: [] },
            { name: 'Legal Claims and Litigation', children: [] },
          ],
        },
        {
          name: 'Communication and Marketing',
          children: [
            { name: 'Marketing Plans', children: [] },
            { name: 'Advertising Contracts', children: [] },
            { name: 'Customer Communications', children: [] },
            { name: 'Branding Guidelines', children: [] },
            { name: 'Public Relations Strategy', children: [] },
          ],
        },
        {
          name: 'Miscellaneous',
          children: [
            { name: 'Miscellaneous Documents and Correspondence', children: [] },
            { name: 'General Templates (e.g., NDAs, Contracts)', children: [] },
            { name: 'Historical Financial Data', children: [] },
            { name: 'Industry Reports', children: [] },
            { name: 'Expert Opinions and Analyst Reports', children: [] },
          ],
        },
      ],
      background: (
         <div className="absolute inset-0 overflow-hidden rounded-t-lg">
          <svg width="100%" height="100%" viewBox="0 0 280 96" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <rect width="280" height="96" fill="#F3EAD9"/>
            <circle cx="213.5" cy="15.5" r="80.5" fill="#EADDCB" fillOpacity="0.5"/>
            <circle cx="60" cy="80" r="60" fill="#EADDCB" fillOpacity="0.3"/>
          </svg>
        </div>
      ),
    },
    {
      title: 'General due diligence',
      description: 'Simplify the diligence process across any sector with secure sharing.',
      folders: [
        { name: 'Legal', children: [
            { name: 'Corporate Organization', children: [] },
            { name: 'Management', children: [] },
            { name: 'Capital Structure', children: [] },
            { name: 'Legal', children: [] },
            { name: 'Real Estate', children: [] },
        ]},
        { name: 'Commercial', children: [
            { name: 'Customers', children: [] },
            { name: 'IT Administrations', children: [] },
            { name: 'Customer Commercial policies', children: [] },
            { name: 'Marketing', children: [] },
            { name: 'Suppliers', children: [{ name: 'Contact', children: [] }] },
        ]},
        { name: 'Financial', children: [
            { name: 'Accounting', children: [] },
            { name: 'Financial', children: [] },
            { name: 'Operating', children: [] },
            { name: 'Insurance', children: [] },
        ]},
        { name: 'HR', children: [
            { name: 'HR agreement', children: [] },
            { name: 'Benefit', children: [] },
            { name: 'General HR', children: [] },
            { name: 'HR policy', children: [] },
        ]},
        { name: 'IP', children: [
            { name: 'IP registration', children: [] },
            { name: 'IP contracts', children: [] },
            { name: 'IP litigation', children: [] },
            { name: 'IP development', children: [] },
        ]},
        { name: 'IT', children: [
            { name: 'IT administration', children: [] },
            { name: 'IT securities', children: [] },
        ]},
        { name: 'Tax', children: [
            { name: 'Tax summaries', children: [] },
            { name: 'Tax return', children: [] },
        ]},
      ],
      background: (
        <div className="absolute inset-0 overflow-hidden rounded-t-lg">
          <svg width="100%" height="100%" viewBox="0 0 280 96" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <rect width="280" height="96" fill="#EAE5DE"/>
            <circle cx="213.5" cy="15.5" r="80.5" fill="#DCD4CA" fillOpacity="0.5"/>
            <circle cx="60" cy="80" r="60" fill="#DCD4CA" fillOpacity="0.3"/>
          </svg>
        </div>
      ),
    },
    {
      title: 'Real estate due diligence',
      description: 'Securely manage property transactions and documentation with ease.',
      folders: [
        { name: 'Property Information', children: [
            { name: 'Property Title and Deed', children: [] },
            { name: 'Property Description and Specifications', children: [] },
            { name: 'Survey Reports', children: [] },
            { name: 'Zoning and Land Use Documents', children: [] },
            { name: 'Environmental Assessments', children: [] },
            { name: 'Site Plans and Blueprints', children: [] },
        ] },
        { name: 'Financial Documents', children: [
            { name: 'Purchase Agreement', children: [] },
            { name: 'Financial Statements', children: [] },
            { name: 'Rent Rolls', children: [] },
            { name: 'Leases and Rental Agreements', children: [] },
            { name: 'Property Tax Records', children: [] },
            { name: 'Operating Expenses', children: [] },
            { name: 'Property Insurance Policies', children: [] },
        ] },
        { name: 'Legal Documents', children: [
            { name: 'Property Deeds', children: [] },
            { name: 'Title Reports', children: [] },
            { name: 'Easements and Encumbrances', children: [] },
            { name: 'Liens and Mortgages', children: [] },
            { name: 'Property Appraisals', children: [] },
            { name: 'Building Permits and Certificates', children: [] },
            { name: 'Property Disclosure Statements', children: [] },
        ] },
        { name: 'Due Diligence Reports', children: [
            { name: 'Legal Due Diligence Report', children: [] },
            { name: 'Environmental Due Diligence Report', children: [] },
            { name: 'Structural Inspection Reports', children: [] },
            { name: 'Property Condition Assessments (PCAs)', children: [] },
            { name: 'Geotechnical Reports', children: [] },
            { name: 'Utility and Infrastructure Assessments', children: [] },
        ] },
        { name: 'Tenant Information', children: [
            { name: 'Lease Agreements', children: [] },
            { name: 'Tenant Profiles', children: [] },
            { name: 'Rent Payment Records', children: [] },
            { name: 'Tenant Improvement Agreements', children: [] },
            { name: 'Lease Assignment and Subletting Agreements', children: [] },
            { name: 'Correspondence with Tenants', children: [] },
        ] },
        { name: 'Insurance and Risk Management', children: [
          { name: 'Property Insurance Policies', children: [] },
          { name: 'Liability Insurance Policies', children: [] },
          { name: 'Insurance Claims History', children: [] },
          { name: 'Risk Assessment Reports', children: [] },
          { name: 'Disaster Recovery Plans', children: [] },
        ] },
        { name: 'Operational Documents', children: [
            { name: 'Maintenance Logs and Records', children: [] },
            { name: 'Service Contracts (e.g., landscaping, security)', children: [] },
            { name: 'Property Management Agreements', children: [] },
            { name: 'Utility Bills and Service Agreements', children: [] },
            { name: 'Inspection Reports', children: [] },
            { name: 'Security and Safety Protocols', children: [] },
        ] },
        { name: 'Regulatory Compliance', children: [
            { name: 'Building Code Compliance Reports', children: [] },
            { name: 'Environmental Compliance Documents', children: [] },
            { name: 'ADA Compliance Documentation', children: [] },
            { name: 'Fire Safety Inspection Reports', children: [] },
            { name: 'Occupational Health and Safety Records', children: [] },
        ] },
        { name: 'Market Analysis', children: [
            { name: 'Comparative Market Analysis (CMA)', children: [] },
            { name: 'Rental Market Analysis', children: [] },
            { name: 'Economic and Demographic Data', children: [] },
            { name: 'Market Trends and Forecasts', children: [] },
            { name: 'Competitor Analysis', children: [] },
            { name: 'Local Development Plans', children: [] },
        ] },
        { name: 'Transaction History and Correspondence', children: [
          { name: 'Offer Letters and Counteroffers', children: [] },
          { name: 'Purchase and Sale Agreements', children: [] },
          { name: 'Escrow and Closing Documents', children: [] },
          { name: 'Correspondence with Sellers, Buyers, and Agents', children: [] },
          { name: 'Due Diligence Checklists and Updates', children: [] },
          { name: 'Meeting Minutes and Memoranda', children: [] },
        ] },
        { name: 'Miscellaneous', children: [
            { name: 'Miscellaneous Documents and Correspondence', children: [] },
            { name: 'General Templates (e.g., NDAs, Contracts)', children: [] },
            { name: 'Historical Financial Data', children: [] },
            { name: 'Industry Reports', children: [] },
            { name: 'Expert Opinions and Analyst Reports', children: [] },
        ] },
      ],
      background: (
        <div className="absolute inset-0 overflow-hidden rounded-t-lg">
          <svg width="100%" height="100%" viewBox="0 0 280 96" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <rect width="280" height="96" fill="#E2EAF0"/>
            <circle cx="213.5" cy="15.5" r="80.5" fill="#D4DFE8" fillOpacity="0.5"/>
            <circle cx="60" cy="80" r="60" fill="#D4DFE8" fillOpacity="0.3"/>
          </svg>
        </div>
      ),
    },
    {
      title: 'Investor due diligence',
      description: 'Secure and organized due diligence for confident investors.',
      folders: [
        { name: 'Corporate Structure', children: [] },
        { name: 'Agreements of Material Importance', children: [] },
        { name: 'Real Estate', children: [] },
        { name: 'Intellectual Property and IT', children: [] },
        { name: 'Labor Issues', children: [] },
        { name: 'Compliance Issues', children: [] },
        { name: 'Operational & Technical Data', children: [] },
        { name: 'Litigation', children: [] },
        { name: 'Financial information', children: [] },
        { name: 'Taxes', children: [] },
        { name: 'Market Overview', children: [] },
        { name: 'Other', children: [] },
      ],
      background: (
        <div className="absolute inset-0 overflow-hidden rounded-t-lg">
          <svg width="100%" height="100%" viewBox="0 0 280 96" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <rect width="280" height="96" fill="#E2E5F0"/>
            <circle cx="213.5" cy="15.5" r="80.5" fill="#D4D9E8" fillOpacity="0.5"/>
            <circle cx="60" cy="80" r="60" fill="#D4D9E8" fillOpacity="0.3"/>
          </svg>
        </div>
      ),
    },
    {
      title: 'Founder Due Diligence',
      description: 'A checklist of documents for founders to prepare for fundraising.',
       folders: [
        { name: 'References', children: [
          { name: 'Customer References', children: [] },
          { name: 'Personal References', children: [] },
        ] },
        { name: 'Corporate Records and Documents', children: [
          { name: 'Organizational Documents', children: [] },
          { name: 'Meeting Minutes', children: [] },
          { name: 'Organizational Charts', children: [] },
          { name: 'Affiliate Companies', children: [] },
        ] },
        { name: 'Business Plans and Financials', children: [
          { name: 'Business Plan', children: [] },
          { name: 'Sales Forecasts', children: [] },
          { name: 'Purchasing Forecasts', children: [] },
          { name: 'Margin Forecasts', children: [] },
          { name: 'Financial Statements', children: [] },
        ] },
        { name: 'Market Research', children: [
            { name: 'Industry Trends', children: [] },
            { name: 'Total Addressable Market Analysis', children: [] },
            { name: 'Customer Acquisition Cost Analysis', children: [] },
            { name: 'Retention Rate Analysis', children: [] },
            { name: 'Competitive Landscape Analysis', children: [] },
            { name: 'Trial Results', children: [] },
            { name: 'Prospective Customer Research', children: [] },
        ] },
        { name: 'Intellectual Property', children: [
          { name: 'Patents', children: [] },
          { name: 'Trademarks', children: [] },
          { name: 'Copyrights', children: [] },
          { name: 'Domain Names', children: [] },
          { name: 'IP Assignments', children: [] },
        ] },
        { name: 'Shareholder Information and Agreements', children: [
          { name: 'List of Owners', children: [] },
          { name: 'Stock and Options Details', children: [] },
          { name: 'Agreements', children: [] },
          { name: 'Vesting Schedules', children: [] },
          { name: 'Voting Rights', children: [] },
        ] },
        { name: 'Material Agreements', children: [
          { name: 'Terms of Service or Use', children: [] },
          { name: 'Agreements with Obligations', children: [] },
          { name: 'Property Leases', children: [] },
          { name: 'Loans and Mortgages', children: [] },
          { name: 'Insurance Policies', children: [] },
          { name: 'Licenses', children: [] },
        ] },
        { name: 'Risks and Potential Litigation', children: [
          { name: 'Lawsuits', children: [] },
          { name: 'Regulatory Investigations', children: [] },
          { name: 'Compliance Concerns', children: [] },
        ] },
        { name: 'Employee Relations and Benefits', children: [
          { name: 'Employee List', children: [] },
          { name: 'Offer Letters', children: [] },
          { name: 'Employee Contracts', children: [] },
          { name: 'Employee Benefits', children: [] },
          { name: 'Severance Plans', children: [] },
          { name: 'Company Policies', children: [] },
        ] },
        { name: 'Equity Grants', children: [
          { name: 'Documentation for Equity Grants', children: [] },
        ] },
      ],
      background: (
        <div className="absolute inset-0 overflow-hidden rounded-t-lg">
           <svg width="100%" height="100%" viewBox="0 0 280 96" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <rect width="280" height="96" fill="#F5E8E8"/>
                <circle cx="213.5" cy="15.5" r="80.5" fill="#E8DADA" fillOpacity="0.5"/>
                <circle cx="60" cy="80" r="60" fill="#E8DADA" fillOpacity="0.3"/>
            </svg>
        </div>
      ),
    },
    {
      title: 'Client Portal',
      description: 'Share project files and updates securely with clients.',
      folders: ['Project Brief', 'Deliverables', 'Invoices', 'Meeting Notes'],
      background: (
        <div className="absolute inset-0 overflow-hidden rounded-t-lg">
            <svg width="100%" height="100%" viewBox="0 0 280 96" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <rect width="280" height="96" fill="#E3F0E8"/>
                <circle cx="213.5" cy="15.5" r="80.5" fill="#D5E8DA" fillOpacity="0.5"/>
                <circle cx="60" cy="80" r="60" fill="#D5E8DA" fillOpacity="0.3"/>
            </svg>
        </div>
      ),
    },
     {
      title: 'Board Meeting',
      description: 'Distribute board materials and minutes securely.',
      folders: ['Agenda', 'Meeting Materials', 'Minutes', 'Action Items'],
      background: (
        <div className="absolute inset-0 overflow-hidden rounded-t-lg">
            <svg width="100%" height="100%" viewBox="0 0 280 96" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <rect width="280" height="96" fill="#E2F0F1"/>
                <circle cx="213.5" cy="15.5" r="80.5" fill="#D4E8EB" fillOpacity="0.5"/>
                <circle cx="60" cy="80" r="60" fill="#D4E8EB" fillOpacity="0.3"/>
            </svg>
        </div>
      ),
    },
    {
      title: 'Onboarding',
      description: 'Streamline new hire onboarding with all necessary documents.',
      folders: ['Offer Letter', 'Company Policies', 'Training Materials', 'IT Setup'],
      background: (
        <div className="absolute inset-0 overflow-hidden rounded-t-lg">
            <svg width="100%" height="100%" viewBox="0 0 280 96" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <rect width="280" height="96" fill="#EAE6F3"/>
                <circle cx="213.5" cy="15.5" r="80.5" fill="#DDD8E9" fillOpacity="0.5"/>
                <circle cx="60" cy="80" r="60" fill="#DDD8E9" fillOpacity="0.3"/>
            </svg>
        </div>
      ),
    },
    {
      title: 'Simple Data Room',
      description: 'A basic, secure data room for general-purpose file sharing.',
      folders: [],
      background: (
        <div className="absolute inset-0 overflow-hidden rounded-t-lg">
             <svg width="100%" height="100%" viewBox="0 0 280 96" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <rect width="280" height="96" fill="#F5ECE2"/>
                <circle cx="213.5" cy="15.5" r="80.5" fill="#E8DED1" fillOpacity="0.5"/>
                <circle cx="60" cy="80" r="60" fill="#E8DED1" fillOpacity="0.3"/>
            </svg>
        </div>
      ),
    },
];

export default function SpacesPage() {
  const { spaces, updateSpace, deleteSpace, addSpace } = useSpaces();
  const { toast } = useToast();
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
  const router = useRouter();

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  // "Name your space" dialog state
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleShareClick = (space: Space) => {
    setSelectedSpace(space);
    setIsShareDialogOpen(true);
  };

  const handleToggleEnable = (spaceId: string, isEnabled: boolean) => {
    const space = spaces.find(s => s.id === spaceId);
    if (space) {
        updateSpace({ ...space, isEnabled });
        toast({
            title: isEnabled ? 'Space Enabled' : 'Space Disabled',
            description: `The Space link has been ${isEnabled ? 'enabled' : 'disabled'}.`,
        });
    }
  };

  const handleDelete = (spaceId: string) => {
    deleteSpace(spaceId);
    toast({
        title: "Space deleted",
        description: "The Space has been successfully deleted.",
    });
  };

  const handleCreateNewSpace = async () => {
    const trimmedName = newSpaceName.trim();
    if (!trimmedName) {
      toast({ variant: 'destructive', title: 'Please enter a name for your space.' });
      return;
    }
    setIsCreating(true);
    try {
      const newId = await addSpace({ name: trimmedName, folders: [] });
      setIsNameDialogOpen(false);
      setNewSpaceName('');
      toast({ title: `Space "${trimmedName}" created!` });
      router.push(`/spaces/${newId}/edit`);
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred.';
      if (msg.includes("plan's limit")) {
        setIsNameDialogOpen(false);
        setUpgradeMsg(msg.replace(' Upgrade in Billing to create more.', ''));
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to create space',
          description: msg,
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  // ✅ FIX: recursively insert all template folders into Supabase
  const insertFoldersToSupabase = async (
    templateFolders: any[],
    spaceId: string,
    parentId: string | null,
    userId: string
  ): Promise<void> => {
    for (const item of templateFolders) {
      const folderName = typeof item === 'string' ? item : item.name;
      const folderId = crypto.randomUUID();

      const { error } = await supabase.from('folders').insert({
        id: folderId,
        user_id: userId,
        name: folderName,
        space_id: spaceId,
        parent_id: parentId,
      });

      if (error) {
        console.error(`Failed to insert folder "${folderName}":`, error);
        continue; // skip this folder but keep going with siblings
      }

      // Recurse into children if any
      if (typeof item === 'object' && item.children && item.children.length > 0) {
        await insertFoldersToSupabase(item.children, spaceId, folderId, userId);
      }
    }
  };

  const handleUseTemplate = async (templateTitle: string, templateFolders: any[]) => {
    setIsCreatingTemplate(true);
    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 2. Create the space (addSpace already writes name + title to Supabase)
      const newSpaceId = await addSpace({ name: templateTitle, folders: [] });

      // 3. Insert all template folders recursively into Supabase
      if (templateFolders && templateFolders.length > 0) {
        await insertFoldersToSupabase(templateFolders, newSpaceId, null, user.id);
      }

      toast({ title: `Space "${templateTitle}" created with all folders!` });
      setIsTemplateGalleryOpen(false);
      router.push(`/spaces/${newSpaceId}/edit`);
    } catch (error: any) {
      toast({
        title: 'Error creating space',
        description: error.message || 'Failed to create space from template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const getInitials = (name?: string | null): string => {
    if (!name || name.trim() === '') return '?';
    const names = name.trim().split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };
  
  const filteredSpaces = useMemo(() => {
    if (!searchQuery) {
      return spaces;
    }
    return spaces.filter(space =>
      space.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [spaces, searchQuery]);

  return (
    <>
    <div className="flex flex-col gap-6">
      <ProductTour
        tourKey="tour-spaces"
        steps={[
          {
            title: 'Welcome to your Spaces',
            description: 'Spaces are your secure data rooms. Create one per deal or company, fill it with documents, then share it with as many secure links as you need.',
          },
          {
            selector: '[data-tour="spaces-create"]',
            title: 'Create a data room',
            description: 'Click here to create a new space, then add your documents, folders, and sections.',
          },
          {
            selector: '[data-tour="spaces-templates"]',
            title: 'Start from a template',
            description: 'Or pick a ready-made template (pitch deck, due diligence, board update) so the structure is set up for you.',
          },
        ]}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Spaces</h1>
        <div className="flex items-center gap-2">
            <Dialog open={isTemplateGalleryOpen} onOpenChange={setIsTemplateGalleryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-tour="spaces-templates">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Browse Templates
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-white p-0 rounded-lg shadow-2xl">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-xl font-semibold text-gray-800">Space template gallery</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[70vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-8 pb-8">
                        {spaceTemplates.map((template, index) => (
                           <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200/80 flex flex-col overflow-hidden group">
                                <div className="relative h-24">
                                    {template.background}
                                </div>
                                <div className="p-4 flex-1 flex">
                                    <div className="w-1/4 flex items-start justify-center pt-1">
                                        <svg width="48" height="60" viewBox="0 0 48 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="48" height="60" rx="3" fill="#F3F4F6"/>
                                            <rect x="6" y="6" width="36" height="4.5" rx="1.5" fill="#E5E7EB"/>
                                            <rect x="6" y="15" width="24" height="3" rx="1.5" fill="#E5E7EB"/>
                                            <rect x="6" y="22.5" width="36" height="1.5" rx="0.75" fill="#D1D5DB"/>
                                            <rect x="6" y="27" width="36" height="1.5" rx="0.75" fill="#D1D5DB"/>
                                            <rect x="6" y="31.5" width="30" height="1.5" rx="0.75" fill="#D1D5DB"/>
                                        </svg>
                                    </div>
                                    <div className="w-3/4 flex flex-col pl-2">
                                        <h3 className="font-bold text-base text-gray-900">{template.title}</h3>
                                        <p className="text-sm text-gray-500 mt-2 leading-snug flex-1" style={{color: '#7a7a7a', fontWeight: 300}}>{template.description}</p>
                                        <div className="mt-4">
                                            <Button
                                                size="sm"
                                                className="bg-black text-white hover:bg-gray-800 px-3 py-1 h-auto text-xs rounded-md"
                                                onClick={() => handleUseTemplate(template.title, template.folders)}
                                                disabled={isCreatingTemplate}
                                            >
                                                {isCreatingTemplate ? 'Creating...' : 'Use template'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                 <DialogFooter className="py-4 px-8 border-t !justify-start bg-white rounded-b-lg">
                    <DialogClose asChild>
                        <Button variant="ghost" className="text-gray-600 hover:bg-gray-100" disabled={isCreatingTemplate}>Cancel</Button>
                    </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button data-tour="spaces-create" onClick={() => { setNewSpaceName(''); setIsNameDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create new Space
            </Button>
        </div>
      </div>

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight">My Spaces</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your shared data rooms.</p>
        </div>
        <TooltipProvider>
        <div className="border-t border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSpaces.length > 0 ? (
                filteredSpaces.map((space, index) => (
                  <TableRow key={`${space.id}-${index}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-md">
                          {space.logo ? (
                            <Image
                              src={space.logo}
                              width={32}
                              height={32}
                              alt={space.name}
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                              {getInitials(space.name)}
                            </div>
                          )}
                        </Avatar>
                        <Link
                          href={`/spaces/${space.id}/edit`}
                          className="hover:underline"
                        >
                          {space.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 border-2 border-background">
                            <div className="h-full w-full rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                               {space.collaborators && space.collaborators.length > 0 ? getInitials(space.collaborators[0].name) : ''}
                            </div>
                        </Avatar>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {format(new Date(space.lastUpdated), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-center">
                        <Switch
                          checked={space.isEnabled}
                          onCheckedChange={(checked) => handleToggleEnable(space.id, checked)}
                          aria-label="Toggle Space"
                        />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end items-center gap-2">
                         <Button
                          variant="outline"
                          size="sm"
                          data-tour="spaces-share"
                           onClick={() => handleShareClick(space)}
                          disabled={!space.isEnabled}
                        >
                          <Share2 className="mr-2 h-3 w-3" />
                          Share
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => handleShareClick(space)}>
                              <Share2 className="mr-2 h-4 w-4" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                               <Link href={`/analytics/space/${space.id}`}>
                                <BarChart2 className="mr-2 h-4 w-4" /> Analytics
                               </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                               <Link href={`/spaces/${space.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                               </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(space.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-96 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      {searchQuery ? (
                        <>
                         <Search className="h-16 w-16" />
                         <h2 className="text-xl font-semibold">No results for &quot;{searchQuery}&quot;</h2>
                         <p>Try searching for something else.</p>
                        </>
                      ) : (
                        <EmptyState
                          illustration={<SpacesIllustration />}
                          title="No spaces yet"
                          description="A space is a secure data room. Group your documents and share them with a single tracked link."
                          action={{ label: 'Create your first space', onClick: () => { setNewSpaceName(''); setIsNameDialogOpen(true); } }}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </TooltipProvider>
      </section>
    </div>

    {/* Name your space dialog */}
    <Dialog open={isNameDialogOpen} onOpenChange={(open) => { if (!isCreating) setIsNameDialogOpen(open); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Name your Space</DialogTitle>
          <DialogDescription>
            Give your new Space a name. You can always rename it later.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="space-name" className="font-medium">Space name</Label>
          <Input
            id="space-name"
            placeholder="e.g. Series A Due Diligence"
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNewSpace(); }}
            autoFocus
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsNameDialogOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreateNewSpace} disabled={!newSpaceName.trim() || isCreating}>
            {isCreating ? 'Creating...' : 'Create Space'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {selectedSpace && (
        <ShareSpaceDialog
          isOpen={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          space={selectedSpace}
        />
    )}

    <UpgradeDialog
      open={!!upgradeMsg}
      onOpenChange={(o) => { if (!o) setUpgradeMsg(null); }}
      title="Space limit reached"
      description={upgradeMsg ?? ''}
    />
    </>
  );
}