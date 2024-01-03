export class HtmlHelper {
  static parseStringAsHtml = (hubViewData: string) => new DOMParser().parseFromString(hubViewData, 'text/html');
}
