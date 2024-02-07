import { Provider } from "@/scripts/import-providers/types";
import { HealthieUser } from "@/services/healthie-api/types";

export interface UserMetadata { gender: string, biography: string }

export type HealthieUserWithMetadata = Omit<HealthieUser, 'metadata'> & { metadata: UserMetadata }

export interface ClientConstraints {
  wantsAssessment: boolean,
  wantsTherapy: boolean,
  canUseInsurance: boolean,
  canReceiveTherapy: boolean,
  canReceiveAssessment: boolean
}

export interface ProviderWithCost extends Provider {
  costInDollars: number
}

export interface Client {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  state: string;
  desired_service: 'assessment' | 'therapy';
  insurance: string;
}