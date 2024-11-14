import React from "react";
import { Button, Grid2, Typography } from "@mui/material";

const Instructions: React.FC = () => {
    return (
        <Grid2 container spacing={2} direction="column">
            <Grid2>
                <Typography variant="h6" gutterBottom>
                    1. Overview
                </Typography>
                <Typography variant="body1">
                    This section provides a general overview of the application, describing its main purpose, features, and what users can accomplish by using it.
                </Typography>
            </Grid2>

            <Grid2>
                <Typography variant="h6" gutterBottom>
                    2. Getting Started
                </Typography>
                <Typography variant="body1">
                    This section guides users through the first steps of using the application, including setting up an account, navigating the interface, and accessing essential features.
                </Typography>
            </Grid2>

            <Grid2>
                <Typography variant="h6" gutterBottom>
                    3. Usage Instructions
                </Typography>
                <Typography variant="body1">
                    Here, users will find detailed instructions on using various features of the application, including tips on optimizing their experience and troubleshooting common issues.
                </Typography>
            </Grid2>

            <Grid2>
                <Typography variant="h6" gutterBottom>
                    4. Additional Resources
                </Typography>
                <Typography variant="body1">
                    This section links to helpful resources, including FAQs, user guides, customer support, and community forums for further assistance.
                </Typography>
            </Grid2>
        </Grid2>
    );
};

export default Instructions;