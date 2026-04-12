#!/usr/bin/env node

/**
 * This script is used to reset the project to a blank state.
 * It deletes or moves client app directories to /app-example based on user input and creates a new client/app directory.
 * You can remove the `reset-project` script from package.json and safely delete this file after running it.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const repoRoot = process.cwd();
const clientRoot = path.join(repoRoot, 'client');
const oldDirs = ['app', 'components', 'hooks', 'constants', 'store', 'storage'];
const exampleDir = 'app-example';
const newAppDir = 'app';
const exampleDirPath = path.join(repoRoot, exampleDir);

const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit client/app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const moveDirectories = async userInput => {
    try {
        if (userInput === 'y') {
            await fs.promises.mkdir(exampleDirPath, { recursive: true });
            console.log(`📁 /${exampleDir} directory created.`);
        }

        for (const dir of oldDirs) {
            const oldDirPath = path.join(clientRoot, dir);
            if (fs.existsSync(oldDirPath)) {
                if (userInput === 'y') {
                    const newDirPath = path.join(exampleDirPath, dir);
                    await fs.promises.rename(oldDirPath, newDirPath);
                    console.log(`➡️ /client/${dir} moved to /${exampleDir}/${dir}.`);
                } else {
                    await fs.promises.rm(oldDirPath, { recursive: true, force: true });
                    console.log(`❌ /client/${dir} deleted.`);
                }
            } else {
                console.log(`➡️ /client/${dir} does not exist, skipping.`);
            }
        }

        const newAppDirPath = path.join(clientRoot, newAppDir);
        await fs.promises.mkdir(newAppDirPath, { recursive: true });
        console.log('\n📁 New /client/app directory created.');

        const indexPath = path.join(newAppDirPath, 'index.tsx');
        await fs.promises.writeFile(indexPath, indexContent);
        console.log('📄 client/app/index.tsx created.');

        const layoutPath = path.join(newAppDirPath, '_layout.tsx');
        await fs.promises.writeFile(layoutPath, layoutContent);
        console.log('📄 client/app/_layout.tsx created.');

        console.log('\n✅ Project reset complete. Next steps:');
        console.log(
            `1. Run \`npx expo start\` to start a development server.\n2. Edit client/app/index.tsx to edit the main screen.${
                userInput === 'y'
                    ? `\n3. Delete the /${exampleDir} directory when you're done referencing it.`
                    : ''
            }`,
        );
    } catch (error) {
        console.error(`❌ Error during script execution: ${error.message}`);
    }
};

rl.question(
    'Do you want to move existing files to /app-example instead of deleting them? (Y/n): ',
    answer => {
        const userInput = answer.trim().toLowerCase() || 'y';
        if (userInput === 'y' || userInput === 'n') {
            moveDirectories(userInput).finally(() => rl.close());
        } else {
            console.log("❌ Invalid input. Please enter 'Y' or 'N'.");
            rl.close();
        }
    },
);
