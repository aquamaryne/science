import React from "react";
import { Button, TextField, Typography, MenuItem, Select, FormControl, InputLabel, SelectChangeEvent } from "@mui/material";
import Grid2 from '@mui/material/Grid2'; // Убедитесь, что Grid2 импортирован правильно

interface RegionData {
    name: string;
    mountain: number;   //гори
    opperation: number; //експлуатація
};

//Коефіцієнти для регіонів гірних доріг та доріг експлуатації
const regions: RegionData[] =[
    { name: 'Автономна Республіка Крим', mountain: 1.15, opperation: 1.15 },
    { name: 'Київська область',          mountain: 1.00, opperation: 1.15 },
    { name: 'Івано-Франківська область', mountain: 1.13, opperation: 1.13 },
    { name: 'Закарпатська область',      mountain: 1.11, opperation: 1.11 },
    { name: 'Львівська область',         mountain: 1.04, opperation: 1.04 },
    { name: 'Чернівецька область',       mountain: 1.00, opperation: 1.04 },
    { name: 'Сумська область',           mountain: 1.00, opperation: 1.00 },
    { name: 'Хмельницька область',       mountain: 1.00, opperation: 1.00 },
    { name: 'Вінницька область',         mountain: 1.00, opperation: 1.00 },
    { name: 'Донецька область',          mountain: 1.00, opperation: 1.00 },
    { name: 'Дніпропетровська область',  mountain: 1.00, opperation: 1.00 },
    { name: 'Волинська область',         mountain: 1.00, opperation: 1.00 },
    { name: 'Житомирська область',       mountain: 1.00, opperation: 1.00 },
    { name: 'Запорізька область',        mountain: 1.00, opperation: 1.00 },
    { name: 'Кіровоградська область',    mountain: 1.00, opperation: 1.00 },
    { name: 'Луганська область',         mountain: 1.00, opperation: 1.00 },
    { name: 'Миколаївська область',      mountain: 1.00, opperation: 1.00 },
    { name: 'Одеська область',           mountain: 1.00, opperation: 1.00 },
    { name: 'Полтавська область',        mountain: 1.00, opperation: 1.00 },
    { name: 'Рівненська: область',       mountain: 1.00, opperation: 1.00 },
    { name: 'Тернопільська область',     mountain: 1.00, opperation: 1.00 },
    { name: 'Черкаська область',         mountain: 1.00, opperation: 1.00 },
    { name: 'Чернігівська область',      mountain: 1.00, opperation: 1.00 },
    { name: 'Харківська область',        mountain: 1.00, opperation: 1.00 },
    { name: 'Херсонська область',        mountain: 1.00, opperation: 1.00 },
];

const PageThree: React.FC = () => {
    const[selectedRegion, setSelectedRegion]    =  React.useState<string>('');
    const[mountain, setMountain]                =  React.useState<number | null>(null);
    const[opperation, setOpperation]            =  React.useState<number | null>(null);
    const[inflationIndex, setInflationIndex]    =  React.useState<number>(1);
    const[result, setResult]                    =  React.useState<number | null>(null);

    const handleRegionChenge = (event: SelectChangeEvent<string>) => {
        const regionName= event.target.value as string;
        setSelectedRegion(regionName);

        const region = regions.find(region => region.name === regionName);
        if(region){
            setMountain(region.mountain);
            setOpperation(region.opperation);
        }
    };

    const handleCalculate = () => {
        if(mountain !== null && opperation !== null){
            const expence = mountain * opperation * inflationIndex;
            setResult(Number(expence.toFixed(2)));
        }
    };

    return(
        <Grid2 container spacing={3} style={{ padding: '20px' }}>
            <Grid2>
                <Typography variant='h4'>Калькулятор нормативних затрат на експлуатацію доріг</Typography>
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6}}>
                <FormControl fullWidth>
                    <InputLabel>Оберіть регіон</InputLabel>
                    <Select value={selectedRegion} onChange={handleRegionChenge}>
                        {regions.map(region => <MenuItem key={region.name} value={region.name}>{region.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid2>
            {selectedRegion && (
                <>
                    <Grid2 container spacing={3} style={{ padding: '20px' }}>
                        <Grid2 size={{ xs: 12, md: 6}}>
                            <TextField label='Коефіцієнт гірних доріг' value={mountain} fullWidth />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6}}>
                            <TextField label='Коефіцієнт доріг експлуатації' value={opperation} fullWidth />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6}}>
                            <TextField label='Індекс інфляції' value={inflationIndex} onChange={e => setInflationIndex(Number(e.target.value))} fullWidth />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6}}>
                            <Button onClick={handleCalculate} variant='contained' color='primary'>Розрахувати</Button>
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6}}>
                            <TextField label='Нормативні затрати на експлуатацію доріг' value={result} fullWidth />
                        </Grid2>
                    </Grid2>
                </>
            )}
        </Grid2>

    )
};

export default PageThree;
