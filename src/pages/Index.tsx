import { ReconvergeDashboard } from "@/components/ReconvergeDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const Index = () => {
  return (
    <ProtectedRoute>
      <ReconvergeDashboard />
    </ProtectedRoute>
  );
};

export default Index;
