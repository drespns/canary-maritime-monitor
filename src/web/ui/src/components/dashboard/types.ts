import type { PipelineMetrics, ShipSnapshot } from "@/lib/pipeline-metrics";

export type MetricsResponse = PipelineMetrics & {
  generatedAt?: string;
};

export type LiveDashboardProps = {
  initialMetrics: MetricsResponse;
};

export type FleetFiltersProps = {
  searchQuery: string;
  portFilter: string;
  portOptions: string[];
  onSearchChange: (value: string) => void;
  onPortChange: (value: string) => void;
};

export type FleetTableProps = {
  ships: ShipSnapshot[];
  totalShips: number;
  selectedMmsi: string | null;
  onShipSelect: (mmsi: string) => void;
};

export type ShipDetailsProps = {
  selectedShip: ShipSnapshot | null;
  selectedIsFilteredOut: boolean;
};

export type RankingsProps = {
  topPorts: Array<{ name: string; vessels: number }>;
  fastestShips: Array<{ mmsi: string; shipName: string; sog: number }>;
  onShipSelect: (mmsi: string) => void;
};
