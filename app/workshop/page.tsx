'use client';
import Game from '../game';
import {useRouter} from 'next/navigation';
export default function Workshop(){const router=useRouter();return <Game editing={true} onBack={()=>router.push('/')} onPaid={()=>{}}/>;}
