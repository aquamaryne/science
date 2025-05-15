import React, { useState} from "react";
import {
    calculateLocalMaintenanceNorms,
    calculateLocalRoadFunding,
    calculateStateMaintenanceNorms,
    calculateStateRoadFunding,
    type StateRoadData,
    type LocalRoadData,
    type MaintenanceNorm,
    type NormByCategory,
    type REGIONS
} from '../modules/block_one';

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Table, TableBody, TableCell, TableHeader, TableFooter,  TableRow, TableHead } from "./ui/table";

const RoadFundingCalculator: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>("block1");
    const [stateRoadData, setStateRoadData] = useState<StateRoadData>({
        Qdz: 0,
        Qpp: 0,
        Qminzhn: 0,
        QIAS: 0,
        Qn: 0,
        Qlik: 0,
        Qvp: 0,
        Qupr: 0,
        QDPP: 0,
    });

    const [localRoadData, setLocalRoadData] = useState<LocalRoadData>({
        Qmz: 0,
        Qkred: 0,
        Qn2: 0,
        QDPP2: 0,
        Qkom: 0,
    });

    const [maintenanceNorms, setMaintenanceNorms] = useState<MaintenanceNorm>({
        stateValue: 604.761,
        localValue: 360.544,
        year: 2023,
        inflationIndices: [1.0],
    });

    const [calculatedStateNorms, setCalculatedStateNorms] = useState<NormByCategory | null>(null);
    const [calculatedLocalNorms, setCalculatedLocalNorms] = useState<NormByCategory | null>(null);

    const handleStateRoadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setStateRoadData(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0,
        }));
    };

    const handleLocalRoadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalRoadData(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0,
        }));
    };

    const handleInflationIndicesChange  = (index: number, value: number) => {
        const newIndices = [...maintenanceNorms.inflationIndices];
        newIndices[index] = value;
        setMaintenanceNorms(prev => ({
            ...prev,
            inflationIndices: newIndices,
        }));
    };

    const handleMaintenanceNormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value} = e.target;
        setMaintenanceNorms(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0,
        }));
    }

    const addInflationIndex = () => {
        setMaintenanceNorms(prev => ({
            ...prev,
            inflationIndices: [...prev.inflationIndices, 1.0],
        }));
    };

    const performStateRoadFundingCalculation = () => {
        const updatedDate = calculateStateRoadFunding(stateRoadData);
        setStateRoadData(updatedDate);
    }

    const performLocalRoadFundingCalculation = () => {
        const updatedData = calculateLocalRoadFunding(localRoadData);
        setLocalRoadData(updatedData);
    };

    const performStateMaintenanceNormsCalculation = () => {
        const normsByCategory = calculateStateMaintenanceNorms(maintenanceNorms);
        setCalculatedStateNorms(normsByCategory);
    }

    const performLocalMaintenanceNormsCalculation = () => {
        const normsByCategory = calculateLocalMaintenanceNorms(maintenanceNorms);
        setCalculatedLocalNorms(normsByCategory);
    }

    const renderStateRoadFundingCalculation = () => (
        <Card className="mb-6">
        <CardHeader>
            <CardTitle>Block 1 - Step 1.1</CardTitle>
            <CardDescription>Determination of total budget for state road development and maintenance</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="text-sm font-medium mb-3">Budget indicators for state roads (thousand UAH)</h4>
                
                <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="Qdz">Total budget for state road construction, reconstruction, repairs and maintenance</Label>
                    <Input
                    id="Qdz"
                    name="Qdz"
                    value={stateRoadData.Qdz}
                    onChange={handleStateRoadInputChange}
                    type="number"
                    />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="Qpp">Budget for border crossing points</Label>
                    <Input
                    id="Qpp"
                    name="Qpp"
                    value={stateRoadData.Qpp}
                    onChange={handleStateRoadInputChange}
                    type="number"
                    />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="Qmizhn">Budget for international projects</Label>
                    <Input
                    id="Qmizhn"
                    name="Qmizhn"
                    value={stateRoadData.Qminzhn}
                    onChange={handleStateRoadInputChange}
                    type="number"
                    />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="QIAS">Budget for information-analytical system</Label>
                    <Input
                    id="QIAS"
                    name="QIAS"
                    value={stateRoadData.QIAS}
                    onChange={handleStateRoadInputChange}
                    type="number"
                    />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="Qn">Budget for research and development</Label>
                    <Input
                    id="Qn"
                    name="Qn"
                    value={stateRoadData.Qn}
                    onChange={handleStateRoadInputChange}
                    type="number"
                    />
                </div>
                </div>
            </div>
            
            <div>
                <h4 className="text-sm font-medium mb-3">Additional budget indicators</h4>
                
                <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="Qlik">Budget for medical facilities</Label>
                    <Input
                    id="Qlik"
                    name="Qlik"
                    value={stateRoadData.Qlik}
                    onChange={handleStateRoadInputChange}
                    type="number"
                    />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="Qvp">Budget for production capacity development</Label>
                    <Input
                    id="Qvp"
                    name="Qvp"
                    value={stateRoadData.Qvp}
                    onChange={handleStateRoadInputChange}
                    type="number"
                    />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="Qupr">Budget for road management</Label>
                    <Input
                    id="Qupr"
                    name="Qupr"
                    value={stateRoadData.Qupr}
                    onChange={handleStateRoadInputChange}
                    type="number"
                    />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="QDPP">Budget for public-private partnership</Label>
                    <Input
                    id="QDPP"
                    name="QDPP"
                    value={stateRoadData.QDPP}
                    onChange={handleStateRoadInputChange}
                    type="number"
                    />
                </div>
                </div>
            </div>
            </div>
            
            <div className="bg-muted p-4 mt-6 rounded-md font-mono text-center">
            <p>
                Q<sub>1</sub> = Q<sub>dz</sub> - Q<sub>pp</sub> - Q<sub>mizhn</sub> - 
                Q<sub>IAS</sub> - Q<sub>n</sub> - Q<sub>lik</sub> - Q<sub>vp</sub> - 
                Q<sub>upr</sub> - Q<sub>DPP</sub>
            </p>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button 
            className="w-full" 
            onClick={performStateRoadFundingCalculation}
            >
            Calculate
            </Button>
            
            {stateRoadData.Q1 !== undefined && (
            <Alert variant="default" className="mt-2 border-green-600">
                <AlertTitle>Result: {stateRoadData.Q1.toLocaleString()} thousand UAH</AlertTitle>
                <AlertDescription className="text-amber-600 font-medium">
                IMPORTANT! This result will be used for further calculations
                </AlertDescription>
            </Alert>
            )}
        </CardFooter>
        </Card>
    );

    // Render Block 1 - Calculation of total budget for local roads
    const renderLocalRoadFundingCalculation = () => (
        <Card className="mb-6">
        <CardHeader>
            <CardTitle>Block 1 - Step 1.2</CardTitle>
            <CardDescription>Determination of total budget for local road development and maintenance</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="text-sm font-medium mb-3">Budget indicators for local roads (thousand UAH)</h4>
                
                <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="Qmz">Total budget for local road construction, reconstruction, repairs and maintenance</Label>
                    <Input
                    id="Qmz"
                    name="Qmz"
                    value={localRoadData.Qmz}
                    onChange={handleLocalRoadInputChange}
                    type="number"
                    />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="Qkred">Budget for loan repayment</Label>
                    <Input
                    id="Qkred"
                    name="Qkred"
                    value={localRoadData.Qkred}
                    onChange={handleLocalRoadInputChange}
                    type="number"
                    />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="Qn2">Budget for research of local roads</Label>
                    <Input
                    id="Qn2"
                    name="Qn2"
                    value={localRoadData.Qn2}
                    onChange={handleLocalRoadInputChange}
                    type="number"
                    />
                </div>
                </div>
            </div>
            
            <div>
                <h4 className="text-sm font-medium mb-3">Additional budget indicators</h4>
                
                <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="QDPP2">Budget for public-private partnership (local)</Label>
                    <Input
                    id="QDPP2"
                    name="QDPP2"
                    value={localRoadData.QDPP2}
                    onChange={handleLocalRoadInputChange}
                    type="number"
                    />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="Qkom">Budget for communal roads</Label>
                    <Input
                    id="Qkom"
                    name="Qkom"
                    value={localRoadData.Qkom}
                    onChange={handleLocalRoadInputChange}
                    type="number"
                    />
                </div>
                </div>
            </div>
            </div>
            
            <div className="bg-muted p-4 mt-6 rounded-md font-mono text-center">
            <p>
                Q<sub>2</sub> = Q<sub>mz</sub> - Q<sub>kred</sub> - Q<sub>n2</sub> - 
                Q<sub>DPP2</sub> - Q<sub>kom</sub>
            </p>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button 
            className="w-full" 
            onClick={performLocalRoadFundingCalculation}
            >
            Calculate
            </Button>
            
            {localRoadData.Q2 !== undefined && (
            <Alert variant="default" className="mt-2 border-green-600">
                <AlertTitle>Result: {localRoadData.Q2.toLocaleString()} thousand UAH</AlertTitle>
                <AlertDescription className="text-amber-600 font-medium">
                IMPORTANT! This result will be used for further calculations
                </AlertDescription>
            </Alert>
            )}
            
            <p className="text-sm text-muted-foreground">
            Note: Calculations for local roads are optional. You can skip this step if not needed.
            </p>
        </CardFooter>
        </Card>
    );

    // Render Block 2 - Calculation of maintenance norms
    const renderMaintenanceNormCalculation = () => (
        <Card>
        <CardHeader>
            <CardTitle>Block 2 - Steps 2.1-2.2</CardTitle>
            <CardDescription>Calculation of maintenance norms for state and local roads</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="text-sm font-medium mb-3">Base maintenance norm parameters</h4>
                
                <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="stateValue">Established norm for state roads (category II, thousand UAH/km)</Label>
                    <Input
                    id="stateValue"
                    name="stateValue"
                    value={maintenanceNorms.stateValue}
                    onChange={handleMaintenanceNormChange}
                    type="number"
                    />
                    <p className="text-xs text-muted-foreground">Base year: {maintenanceNorms.year}</p>
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="localValue">Established norm for local roads (category II, thousand UAH/km)</Label>
                    <Input
                    id="localValue"
                    name="localValue"
                    value={maintenanceNorms.localValue}
                    onChange={handleMaintenanceNormChange}
                    type="number"
                    />
                    <p className="text-xs text-muted-foreground">Base year: {maintenanceNorms.year}</p>
                </div>
                </div>
            </div>
            
            <div>
                <h4 className="text-sm font-medium mb-3">Inflation indices</h4>
                
                <div className="space-y-4">
                {maintenanceNorms.inflationIndices.map((index, i) => (
                    <div className="grid gap-2" key={i}>
                    <Label htmlFor={`inflationIndex-${i}`}>Inflation index {i + 1}</Label>
                    <Input
                        id={`inflationIndex-${i}`}
                        value={index}
                        onChange={(e) => handleInflationIndicesChange(i, parseFloat(e.target.value) || 1.0)}
                        type="number"
                        step="0.01"
                    />
                    </div>
                ))}
                
                <Button 
                    variant="outline" 
                    onClick={addInflationIndex}
                    size="sm"
                >
                    Add Inflation Index
                </Button>
                </div>
            </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button 
                className="flex-1" 
                onClick={performStateMaintenanceNormsCalculation}
            >
                Calculate State Road Norms
            </Button>
            
            <Button 
                className="flex-1" 
                variant="secondary"
                onClick={performLocalMaintenanceNormsCalculation}
            >
                Calculate Local Road Norms
            </Button>
            </div>
            
            {(calculatedStateNorms || calculatedLocalNorms) && (
            <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Calculated Maintenance Norms by Road Category</h3>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Road Category</TableHead>
                    {calculatedStateNorms && (
                        <TableHead className="text-right">State Roads (thousand UAH/km)</TableHead>
                    )}
                    {calculatedLocalNorms && (
                        <TableHead className="text-right">Local Roads (thousand UAH/km)</TableHead>
                    )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                    <TableCell>Category I</TableCell>
                    {calculatedStateNorms && (
                        <TableCell className="text-right">{calculatedStateNorms.categoryI.toFixed(3)}</TableCell>
                    )}
                    {calculatedLocalNorms && (
                        <TableCell className="text-right">{calculatedLocalNorms.categoryI.toFixed(3)}</TableCell>
                    )}
                    </TableRow>
                    <TableRow>
                    <TableCell>Category II</TableCell>
                    {calculatedStateNorms && (
                        <TableCell className="text-right">{calculatedStateNorms.categoryII.toFixed(3)}</TableCell>
                    )}
                    {calculatedLocalNorms && (
                        <TableCell className="text-right">{calculatedLocalNorms.categoryII.toFixed(3)}</TableCell>
                    )}
                    </TableRow>
                    <TableRow>
                    <TableCell>Category III</TableCell>
                    {calculatedStateNorms && (
                        <TableCell className="text-right">{calculatedStateNorms.categoryIII.toFixed(3)}</TableCell>
                    )}
                    {calculatedLocalNorms && (
                        <TableCell className="text-right">{calculatedLocalNorms.categoryIII.toFixed(3)}</TableCell>
                    )}
                    </TableRow>
                    <TableRow>
                    <TableCell>Category IV</TableCell>
                    {calculatedStateNorms && (
                        <TableCell className="text-right">{calculatedStateNorms.categoryIV.toFixed(3)}</TableCell>
                    )}
                    {calculatedLocalNorms && (
                        <TableCell className="text-right">{calculatedLocalNorms.categoryIV.toFixed(3)}</TableCell>
                    )}
                    </TableRow>
                    <TableRow>
                    <TableCell>Category V</TableCell>
                    {calculatedStateNorms && (
                        <TableCell className="text-right">{calculatedStateNorms.categoryV.toFixed(3)}</TableCell>
                    )}
                    {calculatedLocalNorms && (
                        <TableCell className="text-right">{calculatedLocalNorms.categoryV.toFixed(3)}</TableCell>
                    )}
                    </TableRow>
                </TableBody>
                </Table>
                
                <p className="text-sm text-muted-foreground mt-2">
                Note: These norms are required for further calculations of maintenance funds.
                </p>
            </div>
            )}
        </CardContent>
        </Card>
    );

    // Render Block 3 placeholder - State Road Maintenance calculations
    const renderStateRoadMaintenanceCalculation = () => (
        <Card>
        <CardHeader>
            <CardTitle>Block 3 - Steps 2.3-2.5</CardTitle>
            <CardDescription>Calculation of state road maintenance funding</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="mb-4">
            This section allows uploading templates with road data and calculating maintenance costs for state roads.
            </p>
            
            <Alert className="mt-4">
            <AlertTitle>Under Development</AlertTitle>
            <AlertDescription>
                Functionality to be implemented: Upload road data template with state road lengths by category and region, 
                calculate maintenance funding according to section 3.5 of the methodology.
            </AlertDescription>
            </Alert>
        </CardContent>
        </Card>
    );

    // Render Block 4 placeholder - Local Road Maintenance calculations
    const renderLocalRoadMaintenanceCalculation = () => (
        <Card>
        <CardHeader>
            <CardTitle>Block 4 - Steps 2.6-2.8</CardTitle>
            <CardDescription>Calculation of local road maintenance funding</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="mb-4">
            This section allows uploading templates with road data and calculating maintenance costs for local roads.
            </p>
            
            <Alert className="mt-4">
            <AlertTitle>Under Development</AlertTitle>
            <AlertDescription>
                Functionality to be implemented: Upload road data template with local road lengths by category and region, 
                calculate maintenance funding according to section 3.6 of the methodology.
            </AlertDescription>
            </Alert>
        </CardContent>
        </Card>
    );

    return (
        <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Road Funding Calculator</h1>
            <p className="text-muted-foreground">
            Based on the Methodology for determining the funding volume for road construction, 
            current repair and operational maintenance
            </p>
        </div>
        
        <Tabs defaultValue="block1" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="block1">Block 1: Total Budget</TabsTrigger>
            <TabsTrigger value="block2">Block 2: Maintenance Norms</TabsTrigger>
            <TabsTrigger value="block3">Block 3: State Road Maintenance</TabsTrigger>
            <TabsTrigger value="block4">Block 4: Local Road Maintenance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="block1" className="mt-6">
            {renderStateRoadFundingCalculation()}
            {renderLocalRoadFundingCalculation()}
            </TabsContent>
            
            <TabsContent value="block2" className="mt-6">
            {renderMaintenanceNormCalculation()}
            </TabsContent>
            
            <TabsContent value="block3" className="mt-6">
            {renderStateRoadMaintenanceCalculation()}
            </TabsContent>
            
            <TabsContent value="block4" className="mt-6">
            {renderLocalRoadMaintenanceCalculation()}
            </TabsContent>
        </Tabs>
        </div>
    );
}

export default RoadFundingCalculator;