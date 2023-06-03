import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GithubService } from '../../core/services/github.service';
import { MatButtonModule } from '@angular/material/button';
import { ElectronService } from '../../core/services';

@Component({
  standalone: true,
  selector: 'app-github-release-list',
  templateUrl: './github-release-list.component.html',
  styleUrls: ['./github-release-list.component.scss'],
  imports: [CommonModule, MatButtonModule],
  providers: [GithubService],
})
export default class GithubReleaseListComponent {
  #githubService = inject(GithubService);
  #electronService = inject(ElectronService);

  // TODO TEST DATA
  gitHubReleaseList$ = this.#githubService.getGitHubReleaseList('Amands2Mello', 'AmandsGraphics');
}
