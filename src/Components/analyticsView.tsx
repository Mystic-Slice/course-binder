import { NextPage } from "next";
import { useEffect, useState } from "react";
import { PercentageDict } from "~/types";
import { apiReq, tempObject } from "~/utils"

import React, { useRef } from 'react';
import * as Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Options } from 'highcharts';
import Button from "@mui/material/Button";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const DisplayPieChart = ({ child, updateLevelPointer }: { child: PercentageDict, updateLevelPointer: any }) => {
    const HighChart = ({ title }: { title: string }) => {
        const initialOptions: Highcharts.Options = {
            title: {
                text: title,
            },
            series: [
                {
                    type: 'pie',
                    data: [
                        {
                            name: 'Uploaded',
                            y: child.levelPercentage,
                            dataLabels: {
                                enabled: true,
                                format: '{point.name}: {point.y}',
                            },
                        },
                        {
                            name: 'Pending',
                            y: 100 - child.levelPercentage,
                            dataLabels: {
                                enabled: true,
                                format: '{point.name}: {point.y}',
                            },
                        },
                    ],
                },
            ],
            credits: {
                enabled: false, // Disable the credits
            },
            plotOptions: {
                pie: {
                    colors: ['#00FF00', '#FF0000'],
                },

                series: {
                    point: {
                        events: {
                            click: (e: any) => {
                                if (child.children.length > 0) {
                                    updateLevelPointer(child)
                                }
                            }
                        }
                    }
                }
            }
        };
        const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

        const [options, setOptions] = useState<Options>(initialOptions);

        return (
            <HighchartsReact className="justify-start"
                highcharts={Highcharts}
                options={options}
                ref={chartComponentRef}
            // {...props}
            />
        );
    };
    return (
        <div>
            <HighChart title={child.levelElementName}></HighChart>
        </div>

    )
}

const AnalyticsView = ({ level, maxDepth, dept }: { level: string, maxDepth: number, dept?: string }) => {
    const [levelPointerArray, setLevelPointerArray] = useState<PercentageDict[]>([]);

    useEffect(() => {
        (async () => {
            const percentage_dict = await apiReq("channels", {
                type: "GET_PERCENTAGE_DICT",
                level: level,
                maxDepth: maxDepth,
                dept: dept,
            });
            console.log(percentage_dict)
            setLevelPointerArray([percentage_dict]);
        })();
    }, []);

    const updateLevelPointer = (child: PercentageDict) => {
        setLevelPointerArray(levelPointerArray.concat([child]));

    }

    const ReduceLevelPointer = () => {
        setLevelPointerArray(levelPointerArray.slice(0, levelPointerArray.length - 1));
    }
    return (
        <>
            <div className="bg-tertiary-color h-1/5">
                <div className="flex flex-grow">
                    <Button 
                        variant="outlined" 
                        className="bg-secondary-color border-secondary-color hover:bg-hovercolor text-primary-txt rounded my-4" 
                        startIcon={<ArrowBackIcon/>} 
                        onClick={ReduceLevelPointer} 
                        disabled={levelPointerArray.length <= 1} 
                    >
                        Previous
                    </Button>
                </div>
                <div className="flex flex-grow "><h1 className="text-4xl ml-80"><b>FILE SUBMISSION PROGRESS PIECHART</b></h1></div>
            </div>

            <div className="flex flex-wrap overflow-auto max-h-[calc(100vh-80px)]">
                {
                    levelPointerArray[levelPointerArray.length - 1]?.children.map((child) => {
                        return (
                            <div className="w-1/2 p-4 pb-0">
                                <DisplayPieChart child={child} updateLevelPointer={updateLevelPointer}></DisplayPieChart>
                            </div>
                        )
                    })
                }
            </div>
        </>

    )
}

export default AnalyticsView;