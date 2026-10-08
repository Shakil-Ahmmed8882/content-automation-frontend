"use client";

import { useState } from "react";
import { useContextSelector } from "@/components/reusable-ui-blocks/shared-context/useContextSelector";
import { makeSelectorContext } from "@/modules/shared/context/makeSelectorContext";
import { TabsSkeleton } from "../placeholder/skeletons/TabsSkeleton";
import { TabsItem } from "./TabItem";
import type {
  TabsContextType,
  TabsProps,
  TabsProviderProps,
} from "./tabs.type";

export const { Context, Provider } =
  makeSelectorContext<TabsContextType>("Tabs");

// -------------------------------
// TabsProvider with controlled/uncontrolled support
// -------------------------------
export function TabsProvider(props: TabsProviderProps) {
  const { activeTabs, defaultActive = [], multiple = false } = props;

  // if `activeTabs` is provided => controlled mode
  const [internalActiveTabs, setInternalActiveTabs] = useState<string[]>(
    Array.isArray(defaultActive) ? defaultActive : [defaultActive],
  );

  const isControlled = activeTabs !== undefined;
  const currentActiveTabs = isControlled ? activeTabs! : internalActiveTabs;
  const setActiveTabs = isControlled
    ? props.setActiveTabs!
    : setInternalActiveTabs;

  return (
    <Provider
      value={{
        activeTabs: currentActiveTabs,
        setActiveTabs,
        multiple,
        valueAs: props.valueAs,
      }}
    >
      {props.children}
    </Provider>
  );
}

// -------------------------------
// Tabs container
// -------------------------------
export const Tabs = ({ loading = false, children, ...rest }: TabsProps) => {
  if (loading) return <TabsSkeleton />;
  return (
    <div role="tablist" className="flex gap-x-3 md:gap-x-4 " {...rest}>
      {children}
    </div>
  );
};

// -------------------------------
// return UI & States
// -------------------------------
Tabs.Item = TabsItem;
export const useTabs = () => useContextSelector(Context, "Tabs", (ctx) => ctx);

/* ============================ HOW TO USE ============================





export const BusinessNavigationTabs = () => {
    const {setActiveTab, businessFilterTabs} = useBusinessFilterSelector(); 
  

  const handleTabClick = (tabId: string | string[]) => {
    
    const id = Array.isArray(tabId) ? tabId[0] : tabId;
    if (!id) return;
      setActiveTab(id as TBusinessFilterTab)
  };  


  return (
    <>
      <div>
        
          <TabsProvider valueAs="id" defaultActive={['all']}>
          <Tabs className='flex gap-3 flex-wrap'>
            {businessFilterTabs?.map((tab: Tab) => (
              <Tabs.Item   onClick={handleTabClick} key={tab.id} tab={tab} className="!rounded-full !text-[14px] !px-6 md:!px-7.5">
                {tab.value}
              </Tabs.Item>
            ))}
          </Tabs>
        </TabsProvider>
        
      </div>
        
      
    </>
  );
};

*/
