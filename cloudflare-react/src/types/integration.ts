import { type BudgetItem } from "@/modules/block_one";

export interface BlockOneResults {
  q1Value: number;
  q2Value: number;
  totalBudget: number;
  q1Items: BudgetItem[];
  q2Items: BudgetItem[];
  sessionId: string;
  timestamp: Date;
}

export interface BudgetDistribution {
  stateRoads: number;    
  localRoads: number;    
  repairBudget: number; 
}

export interface BlockIntegrationProps {
  budgetData?: BlockOneResults;
  onBack?: () => void;
}