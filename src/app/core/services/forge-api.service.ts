import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { GenericModListSortOrder, GenericModListSortType } from '../components/generic-mod-list/generic-mod-list.component';
import { SptVersion } from '../../../../shared/models/spt-core.model';
import { Mod } from '../models/mod';

export interface BaseApi<T> {
  success: boolean;
  data: T;
}

export interface PaginatedBaseApi<T> extends BaseApi<T> {
  links: ForgeLink;
  meta: ForgeMeta;
}

export interface ForgeLink {
  first: string; // 'https://forge.test/api/v0/mods?page=1';
  last: string; // 'https://forge.test/api/v0/mods?page=1';
  prev: unknown | null;
  next: unknown | null;
}

export interface ForgeMeta {
  current_page: number; // 1
  from: number; // 1
  last_page: number; // 1
  links: ForgeMetaLink[];
  path: string; // "https://forge.test/api/v0/mods"
  per_page: number; // 12,
  to: number; // 2,
  total: number; // 2
}

export interface ForgeMetaLink {
  url: string | null;
  label: string; // "&laquo; Previous",
  active: boolean;
}

export interface ForgeHealth {
  message: string;
}

export interface ForgeUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string; // '2025-04-02T20:44:38.000000Z';
  profile_photo_url: string; // 'https://example.com/path/to/profile.jpg';
  cover_photo_url: string; // 'https://example.com/path/to/cover.jpg';
  created_at: string; // '2025-04-01T10:00:00.000000Z';
}

export interface ForgeMod {
  id: number;
  hub_id: number | null;
  name: string; // 'Recusandae velit incidunt.';
  slug: string; // 'recusandae-velit-incidunt';
  teaser: string; // 'Minus est minima quibusdam necessitatibus inventore iste.';
  thumbnail: string;
  downloads: number; // 55212644;
  source_code_url: string; // 'http://oconnell.com/earum-sed-fugit-corrupti';
  detail_url: string; // 'https://forge.sp-tarkov.com/mods/1/recusandae-velit-incidunt,';
  featured: boolean;
  contains_ads: boolean;
  contains_ai_content: boolean;
  published_at: string; // '2025-01-09T17:48:53.000000Z';
  created_at: string; // '2024-12-11T14:48:53.000000Z';
  updated_at: string; // '2025-04-10T13:50:00.000000Z';
  versions?: SptVersion[];
  dependencies?: unknown[];
}

export interface ForgeModVersion {
  id: number; // 938,
  hub_id: number | null; // null,
  version: string; // "0.2.9",
  description: string; // "Magni eius ad temporibus similique accusamus assumenda aliquid. Quisquam placeat in necessitatibus ducimus quasi odit. Autem nulla ea minus itaque.",
  link: string; // "http://kautzer.com/enim-ut-quis-suscipit-dolores.html",
  spt_version_constraint: string; // "^1.0.0",
  virus_total_link: string; // "https://herman.net/accusantium-vitae-et-totam-deleniti-cupiditate-dolorem-non-sit.html",
  downloads: number; // 8,
  published_at: string; // "2024-05-09T10:49:41.000000Z",
  created_at: string; // "2024-12-19T04:49:41.000000Z",
  updated_at: string; // "2025-02-18T11:49:41.000000Z"
}

export interface ForgeModDetail extends ForgeMod {
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class ForgeApiService {
  private httpClient = inject(HttpClient);

  checkApiHealth() {
    return this.httpClient.get<BaseApi<ForgeHealth>>(`${environment.forgeBasePath}/ping`);
  }

  getSptVersions() {
    const options = { params: new HttpParams().set('sort', '-version') };

    return this.httpClient.get<BaseApi<SptVersion[]>>(`${environment.forgeBasePath}/spt/versions`, options);
  }

  getUserInformation() {
    return this.httpClient.get<BaseApi<ForgeUser>>(`${environment.forgeBasePath}/auth`);
  }

  getMods(sort: GenericModListSortType, sortOrder: GenericModListSortOrder, page: number) {
    const options = {
      params: new HttpParams()
        .set('sort', `${sortOrder === 'DESC' ? '-' : ''}${sort}`)
        .set('page', page)
        .set('includes', 'dependencies')
        .set('per_page', 12),
    };

    return this.httpClient.get<PaginatedBaseApi<ForgeMod[]>>(`${environment.forgeBasePath}/mods`, options);
  }

  searchMod(searchText: string) {
    const options = {
      params: new HttpParams().set('filter[slug]', searchText).set('include', 'versions'),
    };

    return this.httpClient.get<PaginatedBaseApi<Mod[]>>(`${environment.forgeBasePath}/mods`, options);
  }

  getModDetail(modId: number) {
    return this.httpClient.get<BaseApi<ForgeModDetail>>(`${environment.forgeBasePath}/mod/${modId}`);
  }

  getModVersions(modId: number) {
    return this.httpClient.get<PaginatedBaseApi<ForgeModVersion>>(`${environment.forgeBasePath}/mod${modId}`);
  }
}
