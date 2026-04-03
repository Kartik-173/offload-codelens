import { useEffect, useState } from "react";
import RepoApiService from "../services/RepoApiService";
import {
  formatDate,
  ratingLetter,
  computeSizeRating,
  computeIssuesBySeverity,
  buildTree,
} from "../utils/Helpers";

export function useReportDetails(reportKey, userId, onError) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reportKey || !userId) return;

    const load = async () => {
      try {
        setLoading(true);
        const resp = await RepoApiService.fetchReport(reportKey);

        const measures = resp.data?.measures?.component?.measures || [];
        const tree = resp.data?.componentTree?.components || [];
        const branches = resp.data?.branchesList?.branches || [];

        const getVal = (k) =>
          measures.find((m) => m.metric === k)?.value || "0";

        const ncloc = getVal("ncloc");

        setDetails({
          data: resp.data,

          // ✅ restored fields
          organization: resp.data?.organization || "Zip",
          branch: resp.data?.scannedBranch || "main",
          reportDate: formatDate(
            branches?.[0]?.analysisDate || new Date().toISOString()
          ),

          sizeRating: computeSizeRating(ncloc),
          linesOfCode: ncloc,

          projects: new Set(
            tree.map((item) => item.key.split(":")[0])
          ).size.toString(),

          reliabilityRating: ratingLetter(getVal("reliability_rating")),
          securityRating: ratingLetter(getVal("security_rating")),
          maintainabilityRating: ratingLetter(getVal("sqale_rating")),

          bugs: getVal("bugs"),
          vulnerabilities: getVal("vulnerabilities"),
          codeSmells: getVal("code_smells"),

          coverage: getVal("coverage"),
          duplications: getVal("duplicated_lines_density"),

          issues: resp.data?.issues?.items || [],
          issuesBySeverity: computeIssuesBySeverity(
            resp.data?.issues?.items || []
          ),

          codeTree: buildTree(tree),
          hotspots: resp.data?.hotspots || { total: 0, items: [], details: {} },
        });
      } catch (err) {
        console.error("fetchReport failed", err);
        onError?.(
          err?.response?.data?.error?.message ||
          "Failed to load Sonar report"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reportKey, userId]);

  return { details, loading };
}
