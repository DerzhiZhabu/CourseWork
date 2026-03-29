package handler

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"net/http"
	"strings"
	"time"

	"backend-api/models"

	"github.com/gin-gonic/gin"
)

func (h *Handler) PrintWorkerServices(c *gin.Context) {
	var req models.LoadWorkerServicesRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	worker, err := h.repo.GetWorkerByID(req.AccessToken, req.WorkerId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении сотрудника: " + err.Error(),
		})
		return
	}

	services, total, err := h.repo.LoadWorkerServices(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении услуг сотрудника: " + err.Error(),
		})
		return
	}

	fileBytes, err := buildWorkerServicesDocx(worker, services, total, req.DateStart, req.DateEnd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при формировании документа: " + err.Error(),
		})
		return
	}

	filename := fmt.Sprintf("worker_%d_%s_%s.docx",
		worker.ID,
		req.DateStart.Format("2006-01-02"),
		req.DateEnd.Format("2006-01-02"),
	)

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileBytes)
}

func buildWorkerServicesDocx(worker *models.Worker, services *[]models.LoadWorkerServicesSend, total float64, dateStart time.Time, dateEnd time.Time) ([]byte, error) {
	var buffer bytes.Buffer

	zipWriter := zip.NewWriter(&buffer)

	files := map[string]string{
		"[Content_Types].xml": contentTypesXML(),
		"_rels/.rels":         rootRelsXML(),
		"docProps/app.xml":    appXML(),
		"docProps/core.xml":   coreXML(),
		"word/document.xml":   workerDocumentXML(worker, services, total, dateStart, dateEnd),
	}

	for name, content := range files {
		writer, err := zipWriter.Create(name)
		if err != nil {
			return nil, err
		}

		if _, err = writer.Write([]byte(content)); err != nil {
			return nil, err
		}
	}

	if err := zipWriter.Close(); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func workerDocumentXML(worker *models.Worker, services *[]models.LoadWorkerServicesSend, total float64, dateStart time.Time, dateEnd time.Time) string {
	var body strings.Builder

	fullName := strings.TrimSpace(fmt.Sprintf("%s %s %s", worker.Surname, worker.Name, worker.Patronimic))

	body.WriteString(docParagraph("Отчёт по сотруднику"))
	body.WriteString(docParagraph("Сотрудник: " + fullName))
	body.WriteString(docParagraph(fmt.Sprintf("Период: %s - %s",
		dateStart.Format("02.01.2006"),
		dateEnd.Format("02.01.2006"),
	)))
	body.WriteString(docParagraph(fmt.Sprintf("Процент сотрудника: %.2f%%", worker.Procent)))
	body.WriteString(docParagraph(""))

	body.WriteString(`<w:tbl>`)
	body.WriteString(`<w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr>`)
	body.WriteString(docTableRow("Услуга", "Номер заказа", "Зарплата"))

	for _, service := range *services {
		body.WriteString(docTableRow(
			service.Sname,
			fmt.Sprintf("%d", service.Number),
			fmt.Sprintf("%.2f", service.Summary),
		))
	}

	body.WriteString(`</w:tbl>`)
	body.WriteString(docParagraph(""))
	body.WriteString(docParagraph(fmt.Sprintf("Итого зарплата: %.2f", total)))

	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
 xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
 xmlns:v="urn:schemas-microsoft-com:vml"
 xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
 xmlns:w10="urn:schemas-microsoft-com:office:word"
 xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
 xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
 xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
 xmlns:wne="http://schemas.microsoft.com/office/2006/wordml"
 xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
 mc:Ignorable="w14 wp14">
<w:body>` + body.String() + `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`
}

func docParagraph(text string) string {
	return `<w:p><w:r><w:t xml:space="preserve">` + xmlEscape(text) + `</w:t></w:r></w:p>`
}

func docTableRow(values ...string) string {
	var row strings.Builder
	row.WriteString(`<w:tr>`)
	for _, value := range values {
		row.WriteString(`<w:tc><w:p><w:r><w:t xml:space="preserve">` + xmlEscape(value) + `</w:t></w:r></w:p></w:tc>`)
	}
	row.WriteString(`</w:tr>`)
	return row.String()
}

func xmlEscape(value string) string {
	var buffer bytes.Buffer
	_ = xml.EscapeText(&buffer, []byte(value))
	return buffer.String()
}

func contentTypesXML() string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`
}

func rootRelsXML() string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
}

func appXML() string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
<Application>OpenAI Codex</Application>
</Properties>`
}

func coreXML() string {
	now := time.Now().UTC().Format(time.RFC3339)
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Отчёт по сотруднику</dc:title>
<dc:creator>OpenAI Codex</dc:creator>
<cp:lastModifiedBy>OpenAI Codex</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">` + now + `</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">` + now + `</dcterms:modified>
</cp:coreProperties>`
}
