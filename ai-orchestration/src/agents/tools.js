import axios from 'axios';
import {tool} from 'langchain';
import * as z from 'zod';
export const listFiles=tool(
    async ({})=>{
        console.log("===============================");
        console.log("Using list files tool ");
        console.log("===============================");
        const response=await axios.get('http://019f6688-6569-745b-835c-ffc9eb2a7644.agent.localhost/list-files');
        
        console.log("===============================");
        console.log("response from list files tool ",response.data);
        console.log("===============================");
        return JSON.stringify(response.data.files);
    },{
        name:'list_files',
        description:'List all the files in the project directory. This is useful for understanding what files are available to work with',
        schema:z.object({}),
    }
   
)

export const readFiles=tool(
    async ({files=[]})=>{
        console.log("===============================");
        console.log("Using read files tool ");
        console.log("===============================");
        const response=await axios.get('http://019f6688-6569-745b-835c-ffc9eb2a7644.agent.localhost/read-files?files='+files.join(','));

        console.log("===============================");
        console.log("response from read files tool ",response.data);
        console.log("===============================");
        return JSON.stringify(response.data.files);
    },{
        name:'read_files',
        description:'Read the contents of specified files. this is useful for understanding the content of files that are relevant to the task at hand',
        schema:z.object({
            files:z.array(z.string()).describe('The list of files absolute paths to read. these should be files that were listed using the list_files tool or created later.'),
        })
    }
   
)

export const updateFiles=tool(
    async ({files})=>{
        console.log("===============================");
        console.log("Using update files tool ");
        console.log("===============================");
        const response=await axios.patch('http://019f6688-6569-745b-835c-ffc9eb2a7644.agent.localhost/update-files',{
            updates:files
        });
        console.log("===============================");
        console.log("response from update files tool ",response.data);
        console.log("===============================");
        return JSON.stringify(response.data.results);
    },
    {
        name:'update_files',
        description:'Update the content of speified filesThis is useful for making changes to file based on requirements of the task at hand. this tool can also use to create new files by providing a new file name in the file field and the content to be added in the content field.',
        schema:z.object({
            files:z.array(z.object({
                file:z.string().describe("The absolute path of the file to update"),
            content:z.string().describe("The new content for the file ")
        })).describe('The list of files to update and their new contents')
        }),
    }
   
)

