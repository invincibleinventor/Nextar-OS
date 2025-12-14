export default function Welcome(props: any) {
    return (
        <div className="flex flex-col w-full px-6 py-10 h-full font-sf items-center content-center my-auto">
            <div className="dark:text-white font-semibold text-black">Welcome to MacOS-Next{props.txt}</div>
            <div className="text-xs mt-2 text-center dark:text-neutral-300 text-neutral-800">This is a website made using NextJS that emulates the look and feel of MacOS Sonoma</div>

        </div>
    )
}