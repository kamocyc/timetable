import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

type Timetable = {
  duration: number;
  start: Date;
  end: Date;
  name: string;
};

function addMinutes(baseDate: Date, minutes: number): Date {
  const d = new Date(baseDate);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

function newTime(time: string): Date {
  const today = new Date();
  return new Date(today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDay() + " " + time);
}

function toTimeString(t: Date): string {
  return t.toLocaleTimeString('en-US', { hour12: false });
}

function ringAlarm(): void {
  const alarmUrl = './alarm.mp3'
  const audio = new Audio(alarmUrl);
  console.log("RING!!!");
  audio.play();
};

function newArray(length: number): any[] {
  const arr = new Array(length);
  for(let i = 0; i < length; i ++) {
    arr[i] = undefined;
  }
  
  return arr;
}

export const Runner = ( { timeQuotas }: { timeQuotas: Timetable[]}) => {
  const [rangs, setRangs] = useState([] as boolean[]);
  
  const currentTime = new Date();
  
  const getCurrentTimeSpan = (currentTime: Date) => {
    if(timeQuotas.length === 0) return undefined;
    if(currentTime < timeQuotas[0].start) return undefined;
    
    for(let i=0; i<timeQuotas.length; i++) {
      if(currentTime >= timeQuotas[i].start && currentTime <= timeQuotas[i].end) return i;
    }
    
    return undefined;
  };
  
  const currentTimeSpanIndex = getCurrentTimeSpan(currentTime);
  
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("CHECK!!");
      console.log({rangs: rangs});
      const getLastNotRangIndex = () => {
        for(let i = rangs.length - 1; i >= 0; i--) {
          if(!rangs[i]) {
            return i;
          }
        }
        
        return undefined;
      };
      
      const lastIndex = getLastNotRangIndex();
      
      console.log({lastIndex: lastIndex});
      
      if(lastIndex === undefined) { 
        return;
      }
      
      const currentDate = new Date();
      
      console.log({timeQuotas: timeQuotas[lastIndex]});
      
      if(currentDate >= timeQuotas[lastIndex].end) {
        ringAlarm();
        rangs[lastIndex] = true;
        setRangs([...rangs]);
      }
    }, 1000);
    
    setRangs((newArray(timeQuotas.length)).map(() => false));
    
    return () => clearInterval(interval);
  }, [timeQuotas]);
  
  return (
    <>
      <div>{currentTime.toDateString()}</div>
      <div>{currentTimeSpanIndex === undefined ? undefined : timeQuotas[currentTimeSpanIndex].name}</div>
    </>
  );
}

type StoredTime = {
  startTime: string,
  timeQuotas: {duration: number, name: string}[],
};

export const Editor = () => {
  const [startTime, setStartTime] = useState(newTime("8:30"));
  const [timeQuotas, setTimeQuotas] = useState([] as Timetable[]);
  
  useEffect(() => {
    const raw = localStorage.getItem('time');
    if(raw === null) return;
    
    const data = JSON.parse(raw) as StoredTime;
    if(!data.timeQuotas) return;
    
    setStartTime(newTime(data.startTime));
    
    const timeQuotas_ = data.timeQuotas.map(({duration, name}) => ({duration, name, start: new Date(), end: new Date()}));
    
    recalculateTime(timeQuotas_);
  }, []);
  
  const getStoringTime = () => {
    return JSON.stringify({
      startTime: toTimeString(startTime),
      timeQuotas: timeQuotas.map(t => ({duration: t.duration, name: t.name}))
    } as StoredTime);
  };
  
  const recalculateTime = (timeQuotas: Timetable[]) => {
    let currentTime = startTime;
    
    for(const [i, timeQuota] of timeQuotas.entries()) {
      timeQuotas[i].start = currentTime;
      timeQuotas[i].end = addMinutes(currentTime, timeQuota.duration);
      currentTime = timeQuotas[i].end;
    }
    
    localStorage.setItem('time', getStoringTime());
    
    setTimeQuotas([...timeQuotas]);
  };
  
  const handleTimetableSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(newTime(e.target.value));
    
    recalculateTime(timeQuotas);
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    timeQuotas[index].name = e.target.value;
    setTimeQuotas([...timeQuotas]);
  };
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    timeQuotas[index].duration = !isFinite(e.target.value as any) || e.target.value === "" ? 0 : parseInt(e.target.value);
    
    recalculateTime(timeQuotas);
  };
  
  // const interpretTimetableSource = (timetableSource: string, timetableNames: string[]): Timetable[] => {
  //   const [start, ...spans] = timetableSource.split("\n");
  //   // console.dir({start: start, spans: spans});
  //   let currentTime = newTime(start);
  //   const timetables: Timetable[] = [];
  //   // console.dir({currentTime: currentTime});
  //   for(const [i, span] of spans.entries()) {
  //     if(!isFinite(span as any)) continue;
  //     timetables.push({
  //       start: new Date(currentTime),
  //       end: addMinutes(currentTime, parseInt(span)),
  //       name: i < timetableNames.length ? timetableNames[i] : ""
  //     });
      
  //     currentTime = addMinutes(currentTime, parseInt(span));
  //   }
    
  //   console.log({timetables: timetables});
    
  //   return timetables;
  // };
  
  const addRow = () => {
    timeQuotas.push({start: new Date(), end: new Date(), duration: 0, name: ""});
    
    recalculateTime(timeQuotas);
  };
  
  const list = timeQuotas.map((timeQuota, index) => (
    <div key={index}>
      <div>{toTimeString(timeQuota.start)}~{toTimeString(timeQuota.end)}</div>
      <input type="text" value={timeQuota.duration} onChange={e => handleDurationChange(e, index)} />
      <input type="text" value={timeQuota.name} onChange={e => handleNameChange(e, index)} />
    </div>
  ));
  
  return (
    <>
      <input type="text" onChange={handleTimetableSourceChange} value={toTimeString(startTime)} />
      {list}
      <button onClick={addRow}>Add</button>
      <Runner timeQuotas={timeQuotas} />
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Editor />
  </React.StrictMode>,
  document.getElementById('root')
);
