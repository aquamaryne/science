import React from "react";
import { Typography, Box, Grid, Paper } from "@mui/material";

const Instructions: React.FC = () => {
  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom align="center">
        Інструкція користувача
      </Typography>

      <Grid container spacing={4} direction="column">
        {/* Overview */}
        <Grid item>
          <Paper elevation={2} style={{ padding: "16px" }}>
            <Typography variant="h5" gutterBottom>
              1. Огляд
            </Typography>
            <Typography variant="body1">
              Цей додаток дозволяє розрахувати витрати на утримання доріг різних
              категорій. Інструмент містить кілька секцій для введення даних,
              виконання розрахунків і отримання докладних результатів.
            </Typography>
          </Paper>
        </Grid>

        {/* Getting Started */}
        <Grid item>
          <Paper elevation={2} style={{ padding: "16px" }}>
            <Typography variant="h5" gutterBottom>
              2. Початок роботи
            </Typography>
            <Typography variant="body1">
              Виконуйте наступні кроки, щоб почати:
            </Typography>
            <ul>
              <li>
                У верхньому розділі виберіть тип дороги, категорію, впишіть індекс
                інфляції та оберіть область.
              </li>
              <li>
                У розділі "Розрахунок бюджету для місцевих доріг" заповніть
                дані про протяжність доріг по категоріях.
              </li>
              <li>Натисніть кнопку "Розрахувати", щоб отримати результат.</li>
            </ul>       
          </Paper>
        </Grid>

        {/* Usage Instructions */}
        <Grid item>
          <Paper elevation={2} style={{ padding: "16px" }}>
            <Typography variant="h5" gutterBottom>
              3. Інструкція з використання
            </Typography>
            <Typography variant="body1">
              У додатку доступні наступні функції:
            </Typography>
            <ol>
              <li>
                <strong>Розрахунок Наведеного нормативу витрат:</strong> Виберіть
                параметри дороги (тип, категорія, інфляція, область), потім
                натисніть "Розрахувати", щоб отримати норматив витрат у
                гривнях/км.
              </li>
              <li>
                <strong>Розрахунок бюджету для місцевих доріг:</strong> Уведіть
                протяжність доріг по кожній категорії, загальну протяжність і
                коефіцієнт інтенсивності. Натисніть "Розрахувати", щоб отримати
                підсумковий бюджет.
              </li>
              <li>
                <strong>Комплекс робіт:</strong> У розділі "Комплекс робіт"
                введіть обсяги виконання для кожного виду завдання. Система
                автоматично розрахує підсумкові витрати на основі вартості за
                одиницю.
              </li>
            </ol>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Instructions;

