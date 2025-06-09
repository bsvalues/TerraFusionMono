import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { PlusCircle, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MatrixEditorProps {
  matrix: {
    name: string;
    baseCost: number;
    modifiers: { description: string; factor: number }[];
  };
  setMatrix: React.Dispatch<React.SetStateAction<{
    name: string;
    baseCost: number;
    modifiers: { description: string; factor: number }[];
  }>>;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({ matrix, setMatrix }) => {
  const [newModifier, setNewModifier] = useState({
    description: '',
    factor: 1.0
  });

  // Add a new modifier to the matrix
  const addModifier = () => {
    if (!newModifier.description.trim()) return;
    
    setMatrix(prev => ({
      ...prev,
      modifiers: [...prev.modifiers, { ...newModifier }]
    }));
    
    // Reset the form
    setNewModifier({
      description: '',
      factor: 1.0
    });
  };

  // Remove a modifier from the matrix
  const removeModifier = (index: number) => {
    setMatrix(prev => ({
      ...prev,
      modifiers: prev.modifiers.filter((_, i) => i !== index)
    }));
  };

  // Move a modifier up in the list
  const moveModifierUp = (index: number) => {
    if (index === 0) return;
    
    setMatrix(prev => {
      const newModifiers = [...prev.modifiers];
      const temp = newModifiers[index];
      newModifiers[index] = newModifiers[index - 1];
      newModifiers[index - 1] = temp;
      return { ...prev, modifiers: newModifiers };
    });
  };

  // Move a modifier down in the list
  const moveModifierDown = (index: number) => {
    if (index === matrix.modifiers.length - 1) return;
    
    setMatrix(prev => {
      const newModifiers = [...prev.modifiers];
      const temp = newModifiers[index];
      newModifiers[index] = newModifiers[index + 1];
      newModifiers[index + 1] = temp;
      return { ...prev, modifiers: newModifiers };
    });
  };

  // Format the factor as a percentage (e.g., 1.5 → "+50%", 0.8 → "-20%")
  const formatFactor = (factor: number) => {
    const percentage = (factor - 1) * 100;
    return percentage >= 0 ? `+${percentage.toFixed(0)}%` : `${percentage.toFixed(0)}%`;
  };

  // Get color class for the factor badge
  const getFactorColorClass = (factor: number) => {
    if (factor > 1) return "bg-green-500/20 text-green-700 hover:bg-green-500/30";
    if (factor < 1) return "bg-red-500/20 text-red-700 hover:bg-red-500/30";
    return "bg-gray-200 text-gray-700 hover:bg-gray-300";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Add Cost Modifiers</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Define factors that adjust the base cost up or down based on property characteristics.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 items-end">
              <div className="md:col-span-3">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newModifier.description}
                  onChange={(e) => setNewModifier(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Premium Location, Needs Renovation"
                  className="w-full"
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="text-sm font-medium">Factor ({formatFactor(newModifier.factor)})</label>
                <Slider
                  value={[newModifier.factor]}
                  min={0.5}
                  max={2}
                  step={0.05}
                  onValueChange={(values) => setNewModifier(prev => ({ ...prev, factor: values[0] }))}
                  className="py-2"
                />
              </div>
              
              <div>
                <Button 
                  onClick={addModifier}
                  className="w-full"
                  disabled={!newModifier.description.trim()}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Current Modifiers</h3>
            
            {matrix.modifiers.length === 0 ? (
              <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
                No modifiers added yet. Add at least one modifier to continue.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[120px] text-center">Factor</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrix.modifiers.map((modifier, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{modifier.description}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getFactorColorClass(modifier.factor)}>
                          {formatFactor(modifier.factor)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveModifierUp(index)}
                            disabled={index === 0}
                            className="h-8 w-8"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveModifierDown(index)}
                            disabled={index === matrix.modifiers.length - 1}
                            className="h-8 w-8"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeModifier(index)}
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatrixEditor;