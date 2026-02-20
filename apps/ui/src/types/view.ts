export interface ViewProps {
  views: {
    viewName: string
    value: string
  }[];
  viewValue: string
  setViewValue: React.Dispatch<React.SetStateAction<string>>
}
