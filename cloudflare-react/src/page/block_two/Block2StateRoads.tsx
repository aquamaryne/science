import React from 'react';
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface Block2StateRoadsProps {
  stateRoadBaseRate: number;
  setStateRoadBaseRate: (value: number) => void;
  stateInflationIndexes: number[];
  setStateInflationIndexes: (value: number[]) => void;
  stateRoadRate: {
    category1: number;
    category2: number;
    category3: number;
    category4: number;
    category5: number;
  };
  calculateCumulativeInflationIndex: (indexes: number[]) => number;
}

const Block2StateRoads: React.FC<Block2StateRoadsProps> = ({
  stateRoadBaseRate,
  setStateRoadBaseRate,
  stateInflationIndexes,
  setStateInflationIndexes,
  stateRoadRate,
  calculateCumulativeInflationIndex
}) => {
  const addStateInflationIndex = () => {
    setStateInflationIndexes([...stateInflationIndexes, 0]);
  };

  const removeStateInflationIndex = (index: number) => {
    if (stateInflationIndexes.length > 1) {
      const newIndexes = [...stateInflationIndexes];
      newIndexes.splice(index, 1);
      setStateInflationIndexes(newIndexes);
    }
  };

  const handleStateInflationChange = (index: number, value: string) => {
    const newIndexes = [...stateInflationIndexes];
    newIndexes[index] = parseFloat(value) || 0;
    setStateInflationIndexes(newIndexes);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardDescription>
          Приведений норматив річних фінансових витрат на експлуатаційне утримання автомобільних доріг державного значення
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="stateRoadBaseRate">
                Встановлений норматив річних фінансових витрат на ЕУ 1 км дороги II кат. державного значення в цінах 2023 року
              </Label>
              <Input
                id="stateRoadBaseRate"
                type="number"
                value={stateRoadBaseRate}
                onChange={(e) => setStateRoadBaseRate(parseFloat(e.target.value) || 604.761)}
                className="mt-2"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <Label>Індекси інфляції для державних доріг</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={addStateInflationIndex}
                >
                  <Plus className="h-4 w-4 mr-1" /> Додати індекс
                </Button>
              </div>
              <div className="grid gap-2 mt-2">
                {stateInflationIndexes.map((index, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Label className="min-w-[100px]">{`Індекс ${i+1}:`}</Label>
                    <Input
                      type="number"
                      value={index}
                      onChange={(e) => handleStateInflationChange(i, e.target.value)}
                    />
                    <span>%</span>
                    <span className="text-sm text-gray-500">
                      (коеф.: {(1 + index / 100).toFixed(4)})
                    </span>
                    {stateInflationIndexes.length > 1 && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStateInflationIndex(i)}
                        className="ml-2 p-1 h-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <strong>Сукупний індекс інфляції: {calculateCumulativeInflationIndex(stateInflationIndexes).toFixed(4)}</strong>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-4 mt-6">
            <Card className="p-4">
              <CardContent className="p-0 text-center">
                <h3 className="font-bold">Категорія I</h3>
                <div className="text-xl font-bold mt-2">
                  {stateRoadRate.category1.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">тис. грн/км</div>
                <div className="text-xs text-blue-600 mt-1">
                  (коеф. 1.80)
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardContent className="p-0 text-center">
                <h3 className="font-bold">Категорія II</h3>
                <div className="text-xl font-bold mt-2">
                  {stateRoadRate.category2.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">тис. грн/км</div>
                <div className="text-xs text-blue-600 mt-1">
                  (коеф. 1.00)
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardContent className="p-0 text-center">
                <h3 className="font-bold">Категорія III</h3>
                <div className="text-xl font-bold mt-2">
                  {stateRoadRate.category3.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">тис. грн/км</div>
                <div className="text-xs text-blue-600 mt-1">
                  (коеф. 0.89)
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardContent className="p-0 text-center">
                <h3 className="font-bold">Категорія IV</h3>
                <div className="text-xl font-bold mt-2">
                  {stateRoadRate.category4.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">тис. грн/км</div>
                <div className="text-xs text-blue-600 mt-1">
                  (коеф. 0.61)
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardContent className="p-0 text-center">
                <h3 className="font-bold">Категорія V</h3>
                <div className="text-xl font-bold mt-2">
                  {stateRoadRate.category5.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">тис. грн/км</div>
                <div className="text-xs text-blue-600 mt-1">
                  (коеф. 0.39)
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Block2StateRoads;