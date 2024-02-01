import AnalysisResult from './AnalysisResult';

export default interface AnalysisDatabase { 
    [id: string]: AnalysisResult; 
}
