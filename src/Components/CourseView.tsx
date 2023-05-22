// takes in channel_name, channel_code, channel_department
import { Button, Tab, Tabs, TextField } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton"
import { useContext, useEffect, useState } from "react";
import Dropzone from "react-dropzone";
import { CHANNEL_ROLE, Channel, FirebaseFile, FirebaseFolder } from "~/types";
import { DEF_LAB_TEMPLATE, DEF_TEMPLATE, DEF_TEMPLATE2, apiReq, check_template } from "~/utils";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { UserContext } from "~/contexts/UserProvider";
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';

import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';

const FolderComponent = ({ folder, moveIntoFolder }: { folder: FirebaseFolder, moveIntoFolder: any }) => {

    return (

        <div className="bg-[#E3DABA] rounded my-3 h-16 flex px-2 items-center hover:cursor-pointer"onClick={() => moveIntoFolder(folder.name)}>
        {folder.name}       
        </div>
    );
}

const FileUploadDialog = ({ fullPath, refreshCompleteDir }: { fullPath: string, refreshCompleteDir: any }) => {
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false)

    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const closeDialog = () => {
        setUploadFile(null);
        setOpen(false);
    }

    const handleDrop = (acceptedFiles: any) => {
        setUploadFile(acceptedFiles[0])
    }

    const uploadFileToFirebase = async () => {
        setLoading(true)
        console.log(uploadFile);
        const formData = new FormData();
        formData.append("file", uploadFile as Blob, uploadFile?.name as string);
        formData.append("fullPath", fullPath);
        const status = await fetch(`/api/uploadFile`, {
            method: "POST",
            body: formData,
        }).then(t => t.json())

        await refreshCompleteDir();
        setLoading(false)
        alert("File uploaded successfully");
        closeDialog();
    }


    return (
        <div className="h-full">
            <Button variant="contained" className={`bg-secondary-color m-3 inline-block align-middle`} onClick={handleClickOpen}>Upload File</Button>
            <Dialog open={open} onClose={closeDialog}>
                <DialogContent>
                    {
                        uploadFile ?
                            <p>{uploadFile?.name}</p>
                        :
                            <Dropzone onDrop={handleDrop}>
                                {({ getRootProps, getInputProps }) => (
                                    <section>
                                        <div {...getRootProps()}>
                                            <input {...getInputProps()} />
                                            <p>Drag a file here, or click to select a file</p>
                                        </div>
                                    </section>
                                )}
                            </Dropzone>
                    }
                    
                </DialogContent>
                <DialogActions>
                    <LoadingButton
                        loading={loading}
                        loadingPosition="start"
                        startIcon={<UploadIcon />}
                        onClick={uploadFileToFirebase}
                        disabled={uploadFile === null}
                        >
                        Upload
                        </LoadingButton>
                    <Button onClick={closeDialog}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

const FileComponent = ({ file, refreshCompleteDir }: { file: FirebaseFile, refreshCompleteDir: any }) => {
    const [loading, setLoading] = useState(false)
    const deleteFile = async () => {
        const ans = window.confirm(`Delete file ${file.name}?`)
        if(!ans) return

        setLoading(true)
        await apiReq("channels", {
            type: "DELETE_FILE",
            fullPath: file.fullPath,
        });
        await refreshCompleteDir();
        setLoading(false)
    }

    return (
        <div className={`bg-[#E3DABA] rounded h-16 flex relative items-center m-2 ${loading ? "opacity-25": ""}`}>
            {
                file.empty
                            ? <button className="w-6 h-6 disabled flex justify-center rounded-full bg-red-500 hover:bg-red-500 text-white mx-4" disabled></button>

                            : <button className="w-6 h-6 disabled flex justify-center rounded-full bg-green-500 hover:bg-green-500 text-white mx-4" disabled></button>
            }
            <p>{file.name}</p>
            
            <div className="bg-[#E3DABA] absolute right-0 h-full items-center p-2 rounded">
                {
                    file.empty
                        ? <FileUploadDialog fullPath={file.fullPath} refreshCompleteDir={refreshCompleteDir} />

                        : [<button className="mx-10 h-1/2 px-4 pb-4 hover:bg-[#344ec2] my-4 bg-secondary-color inline-block align-middle rounded text-white drop-shadow-lg " onClick={()=>window.open(file.downloadURL, '_blank')}>Download</button>
                        ,
                        <button className="mx-10 h-1/2 px-4 pb-4 hover:bg-[#344ec2] my-4 bg-secondary-color inline-block align-middle rounded text-white drop-shadow-lg " onClick={deleteFile}>Delete</button>]
                }
            </div>
        </div>        
    );
}

const getCurrDirObject = (completeDir: FirebaseFolder, path: string[]) => {
    if (!completeDir) return null;

    let currDir = completeDir;
    path.forEach((folder) => {
        currDir = currDir.children?.find((child) => child.name === folder) as FirebaseFolder;
    });
    return currDir;
}

const TemplateDialog = ({ channel, refreshFileSys }: { channel: Channel, refreshFileSys: any }) => {
    const [customTemplate, setCustomTemplate] = useState<string>(""); // If using custom template
    const [tabIndex, setTabIndex] = useState<number>(0); // 0: Default Template 1, 1: Default Template 2, 2: Custom Template

    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const closeDialog = () => {
        setOpen(false);
    }

    const setTemplateAndClose = async () => {
        let new_template;
        if (tabIndex == 0) {
            new_template = JSON.stringify(DEF_TEMPLATE);
        } else if (tabIndex == 1) {
            new_template = JSON.stringify(DEF_TEMPLATE2);
        } else if (tabIndex == 2) {
            new_template = JSON.stringify(DEF_LAB_TEMPLATE);
        } else {
            let new_temp_obj;
            try {
                new_temp_obj = JSON.parse(customTemplate);
            } catch (e) {
                alert("Invalid template: Invalid JSON");
                return;
            }

            if (!check_template(new_temp_obj)) {
                alert("Invalid template: Format not correct");
                return;
            }
            new_template = customTemplate
        }

        if (channel.channel_template == new_template) {
            closeDialog();
            return;
        }

        const ans = window.confirm(
            "Changing template will remove all existing files related to the channel. This action is not reversible. Are you sure you want to continue?"
        )

        if(!ans) return;
        console.log("Changing Template to", new_template);
        await apiReq("channels", {
            type: "SET_NEW_TEMPLATE",
            channel: channel,
            new_template: new_template,
        });
        await refreshFileSys();
        // await refreshChannels();
        channel.channel_template = new_template;
        alert("Template changed successfully")
        closeDialog();
    }

    return (
        <>
            <Button variant="contained" className="bg-[#F68888] text-black" onClick={handleClickOpen}>Template Settings</Button>
            <Dialog open={open} onClose={closeDialog}>
                <DialogContent className="h-128">
                    <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} aria-label="basic tabs example">
                        <Tab label="Template 1" />
                        <Tab label="Template 2" />
                        <Tab label="Lab Template 1" />
                        <Tab label="Custom Template" />
                    </Tabs>

                    {tabIndex == 0 && <TextField 
                                        className = "h-full w-full bg-gray-200"
                                        value={JSON.stringify(DEF_TEMPLATE, null, 8)}
                                        contentEditable={false}
                                        multiline
                                        rows={13}
                                        />
                    }
                    {tabIndex == 1 && <TextField 
                                        className = "h-full w-full bg-gray-200"
                                        value={JSON.stringify(DEF_TEMPLATE2, null, 8)}
                                        contentEditable={false}
                                        multiline
                                        rows={13}
                                        />
                    }
                    {tabIndex == 2 && <TextField 
                                        className = "h-full w-full bg-gray-200"
                                        value={JSON.stringify(DEF_LAB_TEMPLATE, null, 8)}
                                        contentEditable={false}
                                        multiline
                                        rows={13}
                                        />
                    }
                    {tabIndex == 3 && <TextField 
                                        className = "h-full w-full"
                                        value={customTemplate} 
                                        onChange={(e) => setCustomTemplate(e.target.value)}
                                        multiline
                                        rows={13}
                                        />
                    }
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button onClick={setTemplateAndClose}>Ok</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

const CourseView = ({ channel }: { channel: Channel }) => { 
    const { user } = useContext(UserContext);
    const [channelUserRole, setChannelUserRole] = useState<string>("faculty");

    const [completeDir, setCompleteDir] = useState<FirebaseFolder>({} as FirebaseFolder);
    const [currDir, setCurrDir] = useState<string[]>([]);

    const currDirObject = getCurrDirObject(completeDir, currDir);

    const [selectedFileExtensions, setSelectedFileExtensions] = useState<string[]>([])

    const [selectedFileUploadCategory, setSelectedFileUploadCategory] = useState<string[]>([])

    let finalDisplayItems = currDirObject?.children;
    let AllFileExtensions: string[] = []

    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    };

    const MultipleSelectCheckmarks = ({tag, menuDisplayValue, selectedValue, setSelectedValue }: {tag:string, menuDisplayValue: string[], selectedValue: string[], setSelectedValue: any }) => {

        const handleChange = (event: SelectChangeEvent<typeof selectedFileExtensions>) => {
            const {
                target: { value },
            } = event;
            setSelectedValue(
                value,
                console.log("Value: ", value)
            );
        };

        return (
            <div>
                <FormControl sx={{ m: 1, width: 300 }}>
                    <InputLabel id="demo-multiple-checkbox-label">{tag}</InputLabel>
                    <Select
                        labelId="demo-multiple-checkbox-label"
                        id="demo-multiple-checkbox"
                        multiple
                        value={selectedValue}
                        onChange={handleChange}
                        input={<OutlinedInput label="Tag" />}
                        renderValue={(selected) => selected.join(", ")}
                        MenuProps={MenuProps}
                    >
                        {menuDisplayValue.map((name) => (
                            <MenuItem key={name} value={name}>
                                <Checkbox checked={selectedValue.indexOf(name) > -1} />
                                <ListItemText primary={name} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>
        );
    }

    let file = false;
    if (currDirObject) {
        if (currDirObject.children != undefined) {
            for (let i = 0; i < currDirObject?.children.length; i++) {
                if (currDirObject?.children[i]?.type == "file") {
                    file = true;
                    const FileType = currDirObject?.children[i]?.name.split('.').at(-1) as string;
                    if (!AllFileExtensions.includes(FileType))
                        AllFileExtensions.push(FileType);
                }
            }
        }
    }

    let fileUploadStatus: string[];

    if (file) {
        fileUploadStatus = ["uploaded", "pending"];
    }
    else {
        fileUploadStatus = [];
    }
    console.log("File extension type", AllFileExtensions);

    // status dropdown menu -> 
    finalDisplayItems = finalDisplayItems?.filter((item) => {
        if (selectedFileExtensions.length == 0) {
            return true
        }
        return selectedFileExtensions.includes(item.name.split('.').at(-1) as string)
    })

    finalDisplayItems = finalDisplayItems?.filter((item) => {
        if (selectedFileUploadCategory.length == 0) return true
        if (item.type == "folder") return false
        if (selectedFileUploadCategory.includes("uploaded") && !item.empty) return true
        if (selectedFileUploadCategory.includes("pending") && item.empty) return true
        return false
    })

    const [fsLoading, setFSLoading] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            await refreshFileSys();
        })()
    }, []);

    const refreshFileSys = async () => {
        setFSLoading(true);
        console.log("Refreshing File System");
        await refreshCompleteDir();
        setCurrDir([]);
        setFSLoading(false);
    }

    useEffect(() => {
        (async () => {
            const role = await apiReq("channels", {
                type: "GET_USER_ROLE",
                channel_code: channel.channel_code,
                user_email: user?.email,
            }) as string;
            setChannelUserRole(role);
        })()
    }, [user])

    const refreshCompleteDir = async () => {
        const all_files = await apiReq("channels", {
            type: "ALL_FILES",
            channel: channel,
        }) as FirebaseFolder;
        setCompleteDir(all_files)
    }

    const moveIntoFolder = (folder: string) => {
        setCurrDir([...currDir, folder]);
    }

    const moveOutOfFolder = () => {
        setCurrDir(currDir.slice(0, currDir.length - 1));
    }
    console.log(selectedFileExtensions);
    console.log(selectedFileUploadCategory);

    function handleClick() {
        moveOutOfFolder();
        setSelectedFileExtensions([]);
        setSelectedFileUploadCategory([]);
    }
    // console.log(currDirObject);
    return (
        <div className="h-4/5">
            <div>
                    <p>Course Code: {channel.channel_code}</p>
                    <p>Course Name: {channel.channel_name}</p>
                    <p>Course Deparment: {channel.channel_department}</p>
            </div>

            <div className="w-5/6 h-full  mx-auto bg-secondary-color shadow-lg rounded px-8 py-12 mt-10">
            <div>
                <h1 className="font-bold font-9xl">Current Directory: {currDir.join("/")}</h1>
                <button className="mt-20 flex"onClick={handleClick}>Back</button>
            </div>
            <div>
                <div className="flex justify-end">
                    <div ><MultipleSelectCheckmarks tag = {"File Type"} menuDisplayValue={AllFileExtensions} selectedValue={selectedFileExtensions} setSelectedValue={setSelectedFileExtensions}></MultipleSelectCheckmarks></div>
                    <div ><MultipleSelectCheckmarks tag = {"Upload status"} menuDisplayValue={fileUploadStatus} selectedValue={selectedFileUploadCategory} setSelectedValue={setSelectedFileUploadCategory}></MultipleSelectCheckmarks></div>
                </div>

                {
                    fsLoading ? <div role="status" className="h-full flex items-center justify-center scale-200">
                    <svg aria-hidden="true" className="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-[#EDC3AB]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                    <span className="sr-only">Loading...</span>
                </div> :
                        finalDisplayItems?.map((child) => {
                            if (child.type === "folder") {
                                return <FolderComponent key={child.fullPath} folder={child} moveIntoFolder={moveIntoFolder} />
                            } else {
                                return <FileComponent key={child.fullPath} file={child} refreshCompleteDir={refreshCompleteDir} />
                            }
                        })
                }
            </div>
            </div>
            {
                channelUserRole == CHANNEL_ROLE.COURSE_MENTOR
                    ? <TemplateDialog channel={channel} refreshFileSys={refreshFileSys} />
                    : null
            }
        </div>
    );
}

export default CourseView;