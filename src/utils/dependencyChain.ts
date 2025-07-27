import { ReconModule, DependencyChain } from "@/types/recon";

export class DependencyResolver {
  static buildExecutionChain(modules: ReconModule[]): DependencyChain[] {
    const moduleMap = new Map(modules.map(m => [m.id, m]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: DependencyChain[] = [];

    const visit = (moduleId: string, level = 0): void => {
      if (visiting.has(moduleId)) {
        throw new Error(`Circular dependency detected involving module: ${moduleId}`);
      }
      
      if (visited.has(moduleId)) {
        return;
      }

      visiting.add(moduleId);
      const module = moduleMap.get(moduleId);
      
      if (!module) {
        throw new Error(`Module not found: ${moduleId}`);
      }

      // Find dependencies
      const dependencies: string[] = [];
      
      for (const required of module.requires) {
        // Find modules that produce this required data type
        const producers = modules.filter(m => 
          m.produces.includes(required) && m.id !== moduleId
        );
        
        if (producers.length === 0 && required !== 'domain') {
          // For js-urls, suggest enabling a JS discovery module
          if (required === 'js-urls') {
            throw new Error(`No module produces required data type: ${required} for module: ${moduleId}. Enable 'JS File Discovery' module to resolve this dependency.`);
          }
          throw new Error(`No module produces required data type: ${required} for module: ${moduleId}`);
        }

        // Add all producers as dependencies
        producers.forEach(producer => {
          if (!dependencies.includes(producer.id)) {
            dependencies.push(producer.id);
            visit(producer.id, level + 1);
          }
        });
      }

      visiting.delete(moduleId);
      visited.add(moduleId);

      // Update or add dependency chain entry
      const existingIndex = result.findIndex(r => r.moduleId === moduleId);
      if (existingIndex >= 0) {
        result[existingIndex] = {
          moduleId,
          dependencies,
          level: Math.max(result[existingIndex].level, level)
        };
      } else {
        result.push({
          moduleId,
          dependencies,
          level
        });
      }
    };

    // Visit all modules
    modules.forEach(module => {
      visit(module.id);
    });

    // Sort by level (dependencies first)
    return result.sort((a, b) => a.level - b.level);
  }

  static validateModuleSelection(selectedModules: ReconModule[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const chain = this.buildExecutionChain(selectedModules);
      
      // Check for orphaned modules (modules that require data no selected module produces)
      for (const module of selectedModules) {
        for (const required of module.requires) {
          if (required === 'domain') continue; // Domain is provided by user
          
          const hasProducer = selectedModules.some(m => 
            m.produces.includes(required) && m.id !== module.id
          );
          
          if (!hasProducer) {
            warnings.push(`Module "${module.name}" requires "${required}" but no selected module produces it`);
          }
        }
      }

      // Check for modules that depend on js-urls but no module produces them
      const jsUrlConsumers = selectedModules.filter(m => m.requires.includes('js-urls'));
      if (jsUrlConsumers.length > 0) {
        const hasJsUrlProducer = selectedModules.some(m => m.produces.includes('js-urls'));
        if (!hasJsUrlProducer) {
          errors.push('Modules requiring js-urls are selected but no module produces them. Consider adding a JS file discovery module.');
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown dependency error'],
        warnings
      };
    }
  }

  static getExecutionOrder(modules: ReconModule[]): string[] {
    const chain = this.buildExecutionChain(modules);
    
    // Group by level and sort within each level
    const levelGroups = new Map<number, string[]>();
    
    for (const item of chain) {
      if (!levelGroups.has(item.level)) {
        levelGroups.set(item.level, []);
      }
      levelGroups.get(item.level)!.push(item.moduleId);
    }

    // Flatten the groups in level order
    const order: string[] = [];
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    
    for (const level of sortedLevels) {
      const modules = levelGroups.get(level)!;
      // Sort alphabetically within each level for consistency
      modules.sort();
      order.push(...modules);
    }

    return order;
  }

  static estimateTotalTime(modules: ReconModule[]): number {
    // Calculate total execution time considering parallel execution where possible
    const chain = this.buildExecutionChain(modules);
    const levelGroups = new Map<number, ReconModule[]>();
    const moduleMap = new Map(modules.map(m => [m.id, m]));
    
    for (const item of chain) {
      const module = moduleMap.get(item.moduleId);
      if (!module) continue;
      
      if (!levelGroups.has(item.level)) {
        levelGroups.set(item.level, []);
      }
      levelGroups.get(item.level)!.push(module);
    }

    let totalTime = 0;
    for (const [level, levelModules] of levelGroups) {
      // Modules at the same level can run in parallel, so take the max time
      const maxTimeAtLevel = Math.max(...levelModules.map(m => m.executionTime || 30));
      totalTime += maxTimeAtLevel;
    }

    return totalTime;
  }
}