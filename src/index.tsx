import React, { useEffect, useState } from 'react';
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
  return new Date(today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate() + " " + time);
}

function toTimeString(t: Date): string {
  return t.toLocaleTimeString('en-US', { hour12: false });
}

function min(a: number, b: number): number {
  return a < b ? a : b;
}

function showNotification(title: string, message: string) {
  if (Notification.permission !== 'granted')
    Notification.requestPermission();
  else {
    var notification = new Notification(title, {
      icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
      body: message,
    });
    // notification
  }
}

function ringAlarm(): void {
  const alarmUrl = './alarm.mp3'
  const audio = new Audio(alarmUrl);
  console.log("RING!!!");
  audio.play();
  
  showNotification("Timetable", "Time is up!!!!");
};

function newArray(length: number): any[] {
  const arr = new Array(length);
  for(let i = 0; i < length; i ++) {
    arr[i] = undefined;
  }
  
  return arr;
}

export const Runner = ( { timeQuotas }: { timeQuotas: Timetable[]}) => {
  const [rangs, setRangs] = useState((newArray(timeQuotas.length)).map(() => false));
  const [currentText, setCurrentText] = useState("");
  const currentTime = new Date();
  
  const getCurrentTimeSpan = (currentTime: Date) => {
    if(timeQuotas.length === 0) return undefined;
    if(currentTime < timeQuotas[0].start) return undefined;
    
    // console.log({timeQuotas: timeQuotas});
    
    for(let i=0; i<timeQuotas.length; i++) {
      if(currentTime >= timeQuotas[i].start && currentTime <= timeQuotas[i].end) return i;
    }
    
    return undefined;
  };
  
  useEffect(() => {
    const rangs_ = rangs.length === 0 ? (newArray(timeQuotas.length)).map(() => false) : rangs;
    
    const interval = setInterval(() => {
      const currentDate = new Date();
      
      const currentTimeSpanIndex = getCurrentTimeSpan(currentTime);
      setCurrentText(currentTimeSpanIndex === undefined ? "" : timeQuotas[currentTimeSpanIndex].name);
      
      console.log("CHECK!!");
      // console.log({rangs: rangs_});
      const getLastNotRangIndex = () => {
        for(let i = min(rangs_.length, timeQuotas.length) - 1; i >= 0; i--) {
          if(!rangs_[i] && timeQuotas[i].end <= currentDate && timeQuotas[i].end >= addMinutes(currentDate, -1)) {
            return i;
          }
        }
        
        return undefined;
      };
      
      const lastIndex = getLastNotRangIndex();
      
      // console.log({lastIndex: lastIndex});
      
      if(lastIndex === undefined || timeQuotas.length <= lastIndex) { 
        return;
      }
      
      // console.log({timeQuotas: timeQuotas[lastIndex]});
      
      if(currentDate >= timeQuotas[lastIndex].end) {
        ringAlarm();
        rangs_[lastIndex] = true;
        setRangs([...rangs_]);
      }
    }, 1000);
    
    setRangs(rangs_);
    
    return () => clearInterval(interval);
  }, [timeQuotas]);
  
  return (
    <div className="disp">
      <div>{toTimeString(currentTime)}</div>
      <div>{currentText}</div>
      <div>========================</div>
      {timeQuotas.map((timeQuota, i) => (<div key={i}>{toTimeString(timeQuota.start)} ~ {toTimeString(timeQuota.end)}</div>))}
    </div>
  );
}

export const Editor = () => {
  const [timetableText, setTimetableText] = useState("");
  // const [startTime, setStartTime] = useState(newTime("8:30"));
  const [timeQuotas, setTimeQuotas] = useState([] as Timetable[]);
  
  useEffect(() => {
    const raw = localStorage.getItem('timetableText');
    if(raw === null) return;
    
    setTimetableText(raw);
    interpretTimetableSource(raw);
    
    if (!Notification) {
      alert('Desktop notifications not available in your browser. Try Chromium.');
      return;
    }

    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    
  }, []);
  
  const recalculateTime = (startTime: Date, timeQuotas: {duration: number, name: string}[]) => {
    let currentTime = startTime;
    const quotas = [];
    
    for(const [_i, timeQuota] of timeQuotas.entries()) {
      quotas.push({
        start: currentTime,
        end: addMinutes(currentTime, timeQuota.duration),
        duration: timeQuota.duration,
        name: timeQuota.name
      });
      
      currentTime = addMinutes(currentTime, timeQuota.duration);
    }
    
    setTimeQuotas(quotas);
  };
  
  
  const interpretTimetableSource = (timetableSource: string): void => {
    const [start, ...spans] = timetableSource.split("\n");
    
    recalculateTime(newTime(start), spans.map(s => {
      const [d, n] = s.split(" ");
      return {duration: parseInt(d), name: n};
    }));
  };
  
  const handleTimetableTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTimetableText(e.target.value);
    
    interpretTimetableSource(e.target.value);
    
    localStorage.setItem('timetableText', e.target.value);
  }
  
  return (
    <>
      <textarea className="main-textarea" value={timetableText} onChange={handleTimetableTextChange} />
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
