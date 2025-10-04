export default function BalaDev(props:any){
    return(
       <iframe src="https://baladev.vercel.app" className={`w-full flex flex-grow h-[calc(100%-45px)] ${!props.isMaximized?'rounded-b-2xl':''} `}></iframe>
    )
}