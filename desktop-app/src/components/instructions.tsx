import React from "react";
import { Typography, Box, Grid } from "@mui/material";

const Instructions: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Інструкція користувача
      </Typography>
      <Grid container spacing={3} direction="column">
        {/* Overview */}
        <Grid item>
          <Typography variant="h6" gutterBottom>
            1. Огляд
          </Typography>
          <Typography variant="body1">
            Даний інтерфейс дозволяє користувачам розраховувати бюджет для
            утримання доріг місцевого і державного значення. Ви можете
            використовувати різні секції для внесення даних, отримання
            результатів і детального розрахунку.
          </Typography>
        </Grid>

        {/* Getting Started */}
        <Grid item>
          <Typography variant="h6" gutterBottom>
            2. Початок роботи
          </Typography>
          <Typography variant="body1">
            Спочатку виберіть тип дороги, категорію, індекс інфляції та область
            у верхньому розділі. Потім, у розділі "Розрахунок бюджету для
            місцевих доріг", внесіть протяжність ділянок для кожної категорії
            доріг та загальну протяжність доріг у вашій області.
          </Typography>
        </Grid>

        {/* Usage Instructions */}
        <Grid item>
          <Typography variant="h6" gutterBottom>
            3. Інструкція з використання
          </Typography>
          <Typography variant="body1">
            <ol>
              <li>
                <strong>Розрахунок Наведеного нормативу витрат:</strong> Заповніть
                всі необхідні поля (тип дороги, категорія, інфляція, область) і
                натисніть кнопку "Розрахувати", щоб отримати результат у
                гривнях на кілометр.
              </li>
              <li>
                <strong>Розрахунок бюджету для місцевих доріг:</strong> Виберіть
                область, внесіть протяжність доріг по кожній категорії і
                загальну довжину доріг. Натисніть "Розрахувати", щоб отримати
                підсумковий бюджет.
              </li>
              <li>
                <strong>Комплекс робіт:</strong> У таблиці з роботами для кожного
                типу завдання внесіть обсяг виконання. Підсумкові витрати
                автоматично розрахуються на основі вартості за одиницю.
              </li>
            </ol>
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Instructions;
