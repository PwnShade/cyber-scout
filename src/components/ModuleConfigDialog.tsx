import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReconModule } from "@/types/recon";
import { useState } from "react";

interface ModuleConfigDialogProps {
  module: ReconModule;
  isOpen: boolean;
  onClose: () => void;
  onSave: (options: Record<string, any>) => void;
}

export const ModuleConfigDialog = ({ module, isOpen, onClose, onSave }: ModuleConfigDialogProps) => {
  const [options, setOptions] = useState<Record<string, any>>({});

  const handleSave = () => {
    onSave(options);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure {module.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {module.options?.map(option => (
            <div key={option.id} className="space-y-2">
              <Label>{option.name}</Label>
              <Input
                value={options[option.id] || option.defaultValue || ''}
                onChange={(e) => setOptions(prev => ({ ...prev, [option.id]: e.target.value }))}
                placeholder={option.description}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="cyber" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};