import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReconModule } from "@/types/recon";
import { DependencyResolver } from "@/utils/dependencyChain";
import { Network } from "lucide-react";

interface DependencyVisualizationProps {
  modules: ReconModule[];
}

export const DependencyVisualization = ({ modules }: DependencyVisualizationProps) => {
  const chain = DependencyResolver.buildExecutionChain(modules);
  const executionOrder = DependencyResolver.getExecutionOrder(modules);

  return (
    <Card className="border-cyber-green/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-cyber-green" />
          Dependency Chain
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Execution order: {executionOrder.join(' → ')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {chain.map(item => {
              const module = modules.find(m => m.id === item.moduleId);
              if (!module) return null;
              
              return (
                <div key={item.moduleId} className="p-3 border border-cyber-green/30 rounded-lg">
                  <div className="font-medium text-sm">{module.name}</div>
                  <div className="text-xs text-muted-foreground">Level: {item.level}</div>
                  {item.dependencies.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Depends on: {item.dependencies.map(dep => modules.find(m => m.id === dep)?.name).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};