import React, { useState } from "react";
import { worksData } from "../modules/data";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  TextField,
} from "@mui/material";

const WorksTable: React.FC = () => {
    const [inputs, setInputs] = useState<{ [key: string]: string }>({}); // Хранение ввода в строковом формате
  
    const handleInputChange = (key: string, value: string) => {
      setInputs((prev) => ({
        ...prev,
        [key]: value, // Сохраняем введённое значение как строку
      }));
    };
  
    const calculateCost = (key: string, structure: number, costPerUnit: number) => {
      const workVolume = parseFloat(inputs[key] || "0"); // Преобразуем строку в число или берём 0
      return workVolume * structure * costPerUnit; // Возвращаем итоговую стоимость
    };
  
    return (
      <Box p={3}>
        <Typography variant="h5" mb={3}>
          Комплекс робіт: Нормативи та розрахунки
        </Typography>
        {worksData.map((category, index) => (
          <Box mb={4} key={index}>
            <Typography variant="h6" mb={2}>
              {category.category}
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Найменування роботи</TableCell>
                    <TableCell>Допустимий рівень</TableCell>
                    <TableCell>Нормативний рівень</TableCell>
                    <TableCell>Структура витрат (%)</TableCell>
                    <TableCell>Вартість за одиницю (грн)</TableCell>
                    <TableCell>Обсяг виконання</TableCell>
                    <TableCell>Підсумкові витрати (грн)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {category.works.map((work, idx) => {
                    const key = `${index}-${idx}`;
                    const totalCost = calculateCost(key, work.structure, work.costPerUnit);
  
                    return (
                      <TableRow key={idx}>
                        <TableCell>{work.name}</TableCell>
                        <TableCell>{work.allowable}</TableCell>
                        <TableCell>{work.normative}</TableCell>
                        <TableCell>
                          {work.structure ? `${(work.structure * 100).toFixed(2)}%` : "—"}
                        </TableCell>
                        <TableCell>{work.costPerUnit} грн</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={inputs[key] || ""}
                            onChange={(e) =>
                              handleInputChange(key, e.target.value) // Обрабатываем ввод строки
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{totalCost.toFixed(2)} грн</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
      </Box>
    );
  };
  
  export default WorksTable;

