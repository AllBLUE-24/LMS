// FILE: frontend/verticals/core/index.ts
import { CoreDashboard } from './components/CoreDashboard';

export const config = {
  components: {
    Dashboard: CoreDashboard,
  },
  terminology: {
    lead: 'Lead',
    leads: 'Leads',
  },
};
