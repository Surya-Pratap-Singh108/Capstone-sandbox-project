import axios from "axios";
import { tool } from "langchain";
import * as z from "zod";

export const listFiles = tool(
    async ({ }, config) => {

        const writer=config.writer;

        writer("Listing files in project directory..\n");
        
        try {
            const response = await axios.get(
                `http://sandbox-service-${config.context.projectId}:3000/list-files`,
            );
            writer("Files listed successfully.\n"+"Files:"+response.data.files.join(',')+'\n');


            return JSON.stringify(response.data.files);
        } catch (err) {
            console.error("LIST TOOL ERROR");
            console.error(err.message);
            console.error(err.response?.data);
            throw err;
        }
    },
    {
        name: "list_files",
        description:
            "List all the files in the project directory. This is useful for understanding what files are available to work with",
        schema: z.object({}),
    },
);

export const readFiles = tool(
    async ({ files = [] }, config) => {

        const writer=config.writer;

        writer("Reading files..."+files.join(',')+"\n");
        const response = await axios.get(
            `http://sandbox-service-${config.context.projectId}:3000/read-files?files=` +
            files.join(","),
        );

        writer("Files read successfully.\n");

        return JSON.stringify(response.data.files);
    },
    {
        name: "read_files",
        description:
            "Read the contents of specified files. this is useful for understanding the content of files that are relevant to the task at hand",
        schema: z.object({
            files: z
                .array(z.string())
                .describe(
                    "The list of files absolute paths to read. these should be files that were listed using the list_files tool or created later.",
                ),
        }),
    },
);

export const updateFiles = tool(
    async ({ files }, config) => {

        const writer=config.writer;

        writer("Updating Files..."+files.map(f=>f.file).join(',')+"\n");
        const response = await axios.patch(
            `http://sandbox-service-${config.context.projectId}:3000/update-files`,
            {
                updates: files,
            },
        );

        writer("Files updated successfully\n");

        return JSON.stringify(response.data.results);
    },
    {
        name: "update_files",
        description:
            "Update the content of speified files This is useful for making changes to file based on requirements of the task at hand. Update one or more existing files. If a file does not exist, it will be created. Call this tool ONCE with all required files.",
        schema: z.object({
            files: z
                .array(
                    z.object({
                        file: z
                            .string()
                            .describe("The absolute path of the file to update"),
                        content: z.string().describe("The new content for the file "),
                    }),
                )
                .describe("The list of files to update and their new contents"),
        }),
    },
);
