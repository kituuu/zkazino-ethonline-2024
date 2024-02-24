'use client'

import { Footer } from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { IGame, announcedGames, defaultGames } from './constants/games';
import { useEffect, useState } from 'react';
import { DesktopNavbar } from '@/components/ui/games-store/DesktopNavbar';
import { SOCIALS } from '@/constants/socials';
import { Section1 } from '@/components/ui/games-store/Section1';
import { CentralBlock } from '@/components/ui/games-store/CentralBlock';
import { Section2 } from '@/components/ui/games-store/Section2';

const zkNoidConfig = import('@/games/config');

export default function Home() {
  const [games, setGames] = useState<IGame[]>(defaultGames.concat(announcedGames));

  useEffect(() => {
    zkNoidConfig.then(zkNoidGames => {
      setGames((zkNoidGames.zkNoidConfig.games.map(x => ({
        id: x.id,
        logo: x.image,
        name: x.name,
        description: x.description,
        tags: [],
        defaultPage: x.pageCompetitionsList ? 'competitions-list' : 'global',
        active: true
      })) as IGame[]).concat(announcedGames));
    });
  }, []);

  return (
    <div className='flex min-h-screen flex-col'>
      <DesktopNavbar />

      <main className="px-5 flex flex-col">
        <Section1 />
        <CentralBlock />
        <Section2 games={games} />

        {/* <div className="bg-[url('/image/grid.svg')] w-full h-[481px]" id='grid'>
          <div className="bg-[url('/image/banner.svg')] w-full h-full"></div>
        </div> */}
        
      </main>
      <Footer />
    </div>
  );
}
